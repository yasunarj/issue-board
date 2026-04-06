import { beforeEach, describe, it, expect, vi } from "vitest";
import { createAuditLog } from "./lib/auditLog";
import { kMaxLength } from "node:buffer";

vi.mock("./middleware/auth", () => {
  return {
    authMiddleware: async (c: any, next: () => Promise<void>) => {
      const role = c.req.header("x-test-role");

      if (!role) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      c.set("user", {
        id: "user-1",
        email: "test@example.com",
      });

      c.set("role", role);

      await next();
    }
  }
})

vi.mock("./lib/auditLog", () => {
  return {
    createAuditLog: vi.fn().mockResolvedValue(undefined),
  };
});

const sendMailMock = vi.fn().mockRejectedValue(undefined);

vi.mock("./lib/sendMail", () => {
  return {
    sendMail: sendMailMock,
  }
})

const fromMock = vi.fn(); //まだ中身のない関数 mockImplementationで中身を追加する

vi.mock("./lib/supabase", () => {
  return {
    supabaseAdmin: {
      from: fromMock,
    }
  }
})

beforeEach(() => {
  vi.clearAllMocks();
  fromMock.mockReset();
  sendMailMock.mockResolvedValue(undefined);
});

describe("app", () => {
  it("GET /health で ok: true を返す", async () => {
    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/health"));

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  it("認証なしで /issues にアクセスすると401", async () => {
    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues"));

    expect(res.status).toBe(401);
  });

  it("viewer は issue を作成できない", async () => {
    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-role": "viewer",
      },
      body: JSON.stringify({
        title: "test",
        description: "test",
      })
    }))
    expect(res.status).toBe(403);
  })

  it("空コメントは 400 を返す", async () => {
    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-1/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-role": "member",
      },
      body: JSON.stringify({
        comment: "   ",
      })
    }))

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toEqual({
      error: "comment is required",
    })
  });

  it("open → resolved にトグルされる", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "issues") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { status: "open" },
                error: null,
              })
            })
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({
                  data: {
                    id: "issue-1",
                    title: "Test Issue",
                    status: "resolved",
                  },
                  error: null,
                })
              })
            })
          })
        }
      }

      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  display_name: "Test User",
                },
                error: null,
              })
            })
          })
        }
      }

      return {};
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(
      new Request("http://localhost/issues/issue-1/resolve", {
        method: "PATCH",
        headers: {
          "x-test-role": "member",
        },
      })
    );

    expect(res.status).toBe(200);

    const body = await res.json() as any;
    expect(body.issue.status).toBe("resolved");

    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: "issue.resolve"
    }));
  });

  it("resolved -> open にトグルされる", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "issues") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { status: "resolved" },
              })
            })
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({
                  data: {
                    id: "issue-1",
                    status: "open",
                  },
                  error: null,
                })
              })
            })
          })
        }
      }
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  display_name: "Test User",
                },
                error: null,
              })
            })
          })
        }
      }

      return {};
    })
    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-1/resolve", {
      method: "PATCH",
      headers: {
        "x-test-role": "member",
      }
    }))

    expect(res.status).toBe(200);

    const body = await res.json() as any;

    expect(body.issue.status).toBe("open");
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: "issue.reopen"
    }));
  });

  it("issue が見つからない時 404 を返す", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "issues") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: null,
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-999/resolve", {
      method: "PATCH",
      headers: {
        "x-test-role": "member",
      },
    })
    );

    expect(res.status).toBe(404);

    const body = await res.json();

    expect(body).toEqual({
      error: "Issue not found",
    })
  });

  it("update に失敗すると 500 を返す", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "issues") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  status: "open",
                  title: "Test Title",
                },
                error: null
              }),
            }),
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({
                  data: null,
                  error: {
                    message: "DB update failed",
                  }
                })
              })
            })
          })
        }
      }

      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  display_name: "Test User",
                },
                error: null,
              }),
            }),
          }),
        };
      }

      return {};
    });

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-1/resolve", {
      method: "PATCH",
      headers: {
        "x-test-role": "member",
      },
    })
    );

    expect(res.status).toBe(500);

    const body = await res.json();

    expect(body).toEqual({ error: "DB update failed" });

    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("viewer は issue を削除できない", async () => {
    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-1", {
      method: "DELETE",
      headers: {
        "x-test-role": "viewer",
      }
    })
    )

    expect(res.status).toBe(403);
    const body = await res.json() as { error: string }
    expect(body.error).toBe("Forbidden");

    expect(fromMock).not.toHaveBeenCalled();
    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("admin は issue を削除できる", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "issues") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  id: "issue-1",
                  title: "Test Title",
                },
                error: null,
              })
            })
          }),
          delete: () => ({
            eq: async () => ({
              error: null,
            })
          })
        }
      }

      return {}
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-1", {
      method: "DELETE",
      headers: {
        "x-test-role": "admin",
      }
    }));

    expect(res.status).toBe(200);

    const body = await res.json();

    expect(body).toEqual({ message: "Issue deleted" });
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: "issue.delete",
    }))
  })

  it("delete に失敗すると 500 を返し auditLog が呼ばれない", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "issues") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  id: "issue-1",
                  title: "Test Title"
                }
              })
            })
          }),
          delete: () => ({
            eq: async () => ({
              error: {
                message: "DB delete failed",
              }
            })
          })
        }
      }
      return {}
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-1", {
      method: "DELETE",
      headers: {
        "x-test-role": "admin",
      }
    }))

    expect(res.status).toBe(500);

    const body = await res.json() as { error: string };
    expect(body.error).toBe("Failed to delete issue");

    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("delete対象の issue が見つからない時 404 を返し auditLog は呼ばれない", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "issues") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: null,
                error: { message: "Issue not found" }
              })
            })
          })
        }
      }

      return {}
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-1", {
      method: "DELETE",
      headers: {
        "x-test-role": "admin",
      }
    }))

    expect(res.status).toBe(404);

    const body = await res.json() as { error: string }

    expect(body.error).toBe("Issue not found");
    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("admin 以外は issue を削除できず 403 を返し auditLog は呼ばれない", async () => {
    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-1", {
      method: "DELETE",
      headers: {
        "x-test-role": "member",
      }
    }))

    expect(res.status).toBe(403);

    const body = await res.json() as { error: string };
    expect(body.error).toBe("Forbidden");

    expect(fromMock).not.toHaveBeenCalled();
    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("admin 以外は issue を更新できず 403 を返し auditLog は呼ばれない", async () => {
    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-1", {
      method: "PATCH",
      headers: {
        "x-test-role": "member",
      }
    }));

    expect(res.status).toBe(403);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Forbidden");

    expect(fromMock).not.toHaveBeenCalled();
    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("admin は issue を更新できる", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "issues") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: "issue-1" },
                error: null
              })
            })
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({
                  data: {
                    id: "issue-1",
                    title: "Updated title",
                    description: "Updated description",
                    due_date: "2026-04-04",
                  },
                  error: null
                })
              })
            })
          })
        }
      }

      return {}
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-test-role": "admin"
      },
      body: JSON.stringify({
        title: "Updated title",
        description: "Updated description",
        dueDate: "2026-04-04"
      })
    }))

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.message).toBe("Issue updated");
    expect(body.issue.title).toBe("Updated title");

    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "issue.update"
      })
    );
  })

  it("update対象の issue が見つからない時 404 を返し auditLog は呼ばれない", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "issues") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: null,
                error: { message: "Issue not found" }
              })
            })
          })
        }
      }
      return {}
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-test-role": "admin",
      },
      body: JSON.stringify({
        title: "Updated title",
        description: "Updated description",
        dueDate: "2026-04-05",
      })
    }));

    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Issue not found");

    expect(createAuditLog).not.toHaveBeenCalled();
  });

  it("updateに失敗すると 500 を返し auditLog は呼ばれない", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "issues") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: "issue-1" },
                error: null,
              })
            })
          }),
          update: () => ({
            eq: () => ({
              select: () => ({
                single: async () => ({
                  data: null,
                  error: { message: "DB update failed" },
                })
              })
            })
          })
        }
      }
      return {};
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-test-role": "admin",
      },
      body: JSON.stringify({
        title: "Updated title",
        description: "Updated description",
        dueDate: "2026-04-05",
      })
    }))

    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Failed to update issue");
    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("member は Issue を作成できる", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { display_name: "user-1" },
                error: null
              })
            })
          })
        }
      }

      if (table === "issues") {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: {
                  id: "issue-1",
                  title: "New issue",
                  description: "New description",
                  due_date: "2026-04-10",
                  created_by: "test-user"
                }
              })
            })
          })
        }
      }
      return {}
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-role": "member",
      },
      body: JSON.stringify({
        title: "New issue",
        description: "New description",
        dueDate: "2026-04-10",
      })
    }))

    expect(res.status).toBe(201);
    const body = await res.json() as any;

    expect(body.message).toBe("Issue created");
    expect(body.issue.title).toBe("New issue");

    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "issue.create"
      })
    )
    expect(sendMailMock).toHaveBeenCalled();
  })

  it("admin は Issue を作成できる", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { display_name: "admin-user" },
                error: null
              })
            })
          })
        }
      }

      if (table === "issues") {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: {
                  id: "issue-1",
                  title: "Admin title",
                  description: "Admin description",
                  due_date: null,
                  created_by: "admin-user"
                }
              })
            })
          })
        }
      }
      return {}
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-role": "admin",
      },
      body: JSON.stringify({
        title: "Admin title",
        description: "Admin description",
        dueDate: "",
      })
    }))

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.message).toBe("Issue created");
    expect(body.issue.title).toBe("Admin title");
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "issue.create" })
    );
    expect(sendMailMock).toHaveBeenCalled();
  })

  it("title が空だと 400 を返し auditLog は呼ばれない", async () => {
    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-role": "admin",
      },
      body: JSON.stringify({
        title: "  ",
        description: "Admin description",
        dueDate: "2026-04-10",
      })
    }))

    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("title is required");
    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("issue 作成に失敗すると 500 を返し auditLog は呼ばれない", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { display_name: "user-3" },
                error: null,
              })
            })
          })
        }
      }

      if (table === "issues") {
        return {
          insert: () => ({
            select: () => ({
              single: () => ({
                data: null,
                error: { message: "DB insert failed" }
              })
            })
          })
        }
      }
      return {}
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-role": "admin",
      },
      body: JSON.stringify({
        title: "test-title",
        description: "test-description",
        dueDate: "2026-04-05",
      })
    }));

    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("DB insert failed");
    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("sendMail が失敗しても issueは作成され 201 を返し auditLog も呼ばれる", async () => {
    sendMailMock.mockRejectedValueOnce(new Error("mail failed"));

    fromMock.mockImplementation((table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { display_name: "user-4" },
                error: null
              })
            })
          })
        }
      }
      if (table === "issues") {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: {
                  id: "issue-1",
                  title: "test-title",
                  description: "test-description",
                  due_date: null,
                  created_by: "user-4",
                }
              })
            })
          })
        }
      }
      return {}
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-role": "admin",
      },
      body: JSON.stringify({
        title: "test-title",
        description: "test-description",
        dueDate: ""
      })
    }))

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.message).toBe("Issue created");
    expect(body.issue.description).toBe("test-description");

    expect(createAuditLog).toHaveBeenCalled();
  })

  it("member はコメントを作成できる", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "issues") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: "issue-1" },
                error: null,
              })
            })
          })
        }
      }

      if (table === "issue_comments") {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: {
                  issue_id: "issue-1",
                  user_id: "user-1",
                  body: "Test comment",
                }
              })
            })
          })
        }
      }

      return {};
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-1/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-role": "member",
      },
      body: JSON.stringify({ comment: "Test comment" })
    }))

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.message).toBe("comment created");
    expect(body.comment.body).toBe("Test comment");

    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "comment.create" })
    )
  })

  it("viewer はコメントを作成できない", async () => {
    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-2/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-role": "viewer",
      },
      body: JSON.stringify("Test comment2")
    }))

    expect(res.status).toBe(403);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Forbidden");

    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("issue が存在しない場合コメント作成は 404", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "issues") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: null,
                error: { message: "Issue not found" }
              })
            })
          })
        }
      }

      return {}
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-3/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-role": "member",
      },
      body: JSON.stringify({ comment: "Test comment" })
    }))

    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Issue not found");

    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("コメント作成に失敗すると 500", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "issues") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: "issue-4" },
                error: null
              })
            })
          })
        }
      }
      if (table === "issue_comments") {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({
                data: null,
                error: "DB insert comment failed"
              })
            })
          })
        }
      }
      return {}
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-4/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-role": "admin",
      },
      body: JSON.stringify({ comment: "Test comment" })
    }))

    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Failed to create comment");

    expect(createAuditLog).not.toHaveBeenCalled()
  })

  it("member は comment を取得できる", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "issues") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: "issue-1" },
                error: null
              })
            })
          })
        }
      }

      if (table === "issue_comments") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [{
                  id: "comment-1",
                  issue_id: "issue-1",
                  body: "Test Comment"
                }],
                error: null
              })
            })
          })
        }
      }

      return {}
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issues-1/comments", {
      method: "GET",
      headers: {
        "x-test-role": "member",
      }
    }));

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.comments).toHaveLength(1);
    expect(body.comments[0].body).toBe("Test Comment")
  })

  it("comments 取得時に issue が見つからないと 404 を返す", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "issues") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: null,
                error: { message: "DB issue not found" },
              })
            })
          })
        }
      }

      return {};
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-1/comments", {
      method: "GET",
      headers: {
        "x-test-role": "member",
      }
    }))

    expect(res.status).toBe(404);
    const body = await res.json() as { error: string }
    expect(body.error).toBe("Issue not found");
  })

  it("comments 取得失敗時に 500 を返す", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "issues") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: "issue-1" },
                error: null
              })
            })
          })
        }
      }

      if (table === "issue_comments") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: null,
                error: { message: "DB comments not found" },
              })
            })
          })
        }
      }

      return {}
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-1/comments", {
      method: "GET",
      headers: {
        "x-test-role": "member",
      }
    }))

    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Failed to fetch comments");
  })

  it("viewer も comments 取得できる", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "issues") {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { id: "issue-1" },
                error: null
              })
            })
          })
        }
      }

      if (table === "issue_comments") {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [{
                  id: "comment-1",
                  issue_id: "issue-1",
                  body: "Test comment"
                }],
                error: null
              })
            })
          })
        }
      }

      return {}
    })

    const { createApp } = await import("./app");
    const app = createApp();
    const res = await app.fetch(new Request("http://localhost/issues/issue-1/comments", {
      method: "GET",
      headers: {
        "x-test-role": "viewer",
      }
    }))

    expect(res.status).toBe(200);
    const body = await res.json() as any;

    expect(body.ok).toBe(true);
    expect(body.comments[0].body).toBe("Test comment");
  })

  it("admin 以外は comment を削除できず 403 を返す", async () => {
    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-1/comments/comment-1", {
      method: "DELETE",
      headers: {
        "x-test-role": "member"
      }
    }))

    expect(res.status).toBe(403);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Forbidden");
    expect(fromMock).not.toHaveBeenCalled();
    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("admin は comment を削除できる", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "issue_comments") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    id: "comment-1",
                    issue_id: "issue-1",
                    body: "Test comment",
                  },
                  error: null,
                })
              })
            })
          }),
          delete: () => ({
            eq: async () => ({
              error: null
            })
          })
        }
      }
      return {}
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-1/comments/comment-1", {
      method: "DELETE",
      headers: {
        "x-test-role": "admin",
      }
    }))

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.message).toBe("Comment deleted");
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "comment.delete"
      })
    );
  })

  it("comment が見つからない場合 404 を返し auditLog は呼ばれない", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "issue_comments") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => ({
                  data: null,
                  error: { message: "comment not found" }
                })
              })
            })
          })
        }
      }
      return {}
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await app.fetch(new Request("http://localhost/issues/issue-4/comments/comment-4", {
      method: "DELETE",
      headers: {
        "x-test-role": "admin"
      }
    }))

    expect(res.status).toBe(404)
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Comment not found");
    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("comment の削除に失敗すると 500 を返し auditLog は呼ばれない", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "issue_comments") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: async () => ({
                  data: {
                    id: "comment-2",
                    issue_id: "issue-2",
                    body: "Test comment-2"
                  }
                })
              })
            })
          }),

          delete: () => ({
            eq: async () => ({
              error: { message: "Failed to delete comment" }
            })
          })
        }
      }

      return {}
    })

    const { createApp } = await import("./app");
    const app = createApp();
    const res = await app.fetch(new Request("http://localhost/issues/issue-2/comments/comment-2", {
      method: "DELETE",
      headers: {
        "x-test-role": "admin",
      }
    }))

    expect(res.status).toBe(500)
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Failed to delete comment");

    expect(createAuditLog).not.toHaveBeenCalled();
  })

})


// import { beforeEach, describe, expect, it, vi } from "vitest";

// const fromMock = vi.fn();
// const createAuditLogMock = vi.fn();
// const sendMailMock = vi.fn();

// vi.mock("./middleware/auth", () => {
//   return {
//     authMiddleware: async (c: any, next: () => Promise<void>) => {
//       const role = c.req.header("x-test-role");

//       if (!role) {
//         return c.json({ error: "Unauthorized" }, 401);
//       }

//       c.set("user", {
//         id: "user-1",
//         email: "test@example.com",
//       });
//       c.set("role", role);

//       await next();
//     },
//   };
// });

// vi.mock("./lib/supabase", () => {
//   return {
//     supabaseAdmin: {
//       from: fromMock,
//     },
//   };
// });

// vi.mock("./lib/auditLog", () => {
//   return {
//     createAuditLog: createAuditLogMock,
//   };
// });

// vi.mock("./lib/sendMain", () => {
//   return {
//     sendMail: sendMailMock,
//   };
// });

// type MockResult = {
//   data?: unknown;
//   error?: unknown;
// };

// type ChainState = {
//   table: string;
//   operation: "select" | "insert" | "update" | "delete" | null;
//   filters: Array<{ column: string; value: string }>;
//   insertPayload?: unknown;
//   updatePayload?: unknown;
// };

// const createBuilder = (
//   resolver: (state: ChainState) => MockResult | Promise<MockResult>,
//   state: ChainState,
// ) => {
//   const builder = {
//     select: vi.fn(() => {
//       if (state.operation === null) {
//         state.operation = "select";
//       }
//       return builder;
//     }),
//     insert: vi.fn((payload: unknown) => {
//       state.operation = "insert";
//       state.insertPayload = payload;
//       return builder;
//     }),
//     update: vi.fn((payload: unknown) => {
//       state.operation = "update";
//       state.updatePayload = payload;
//       return builder;
//     }),
//     delete: vi.fn(() => {
//       state.operation = "delete";
//       return builder;
//     }),
//     eq: vi.fn((column: string, value: string) => {
//       state.filters.push({ column, value });
//       return builder;
//     }),
//     order: vi.fn(() => builder),
//     limit: vi.fn(() => builder),
//     maybeSingle: vi.fn(async () => resolver(state)),
//     single: vi.fn(async () => resolver(state)),
//   };

//   return builder;
// };

// const createFromMockImplementation = (
//   resolver: (state: ChainState) => MockResult | Promise<MockResult>,
// ) => {
//   return (table: string) =>
//     createBuilder(resolver, {
//       table,
//       operation: null,
//       filters: [],
//     });
// };

// const request = async (
//   app: { fetch: (request: Request) => Promise<Response> },
//   path: string,
//   init?: RequestInit,
// ) => {
//   return app.fetch(
//     new Request(`http://localhost${path}`, {
//       ...init,
//       headers: {
//         "Content-Type": "application/json",
//         ...(init?.headers ?? {}),
//       },
//     }),
//   );
// };

// describe("issues API", () => {
//   beforeEach(() => {
//     vi.resetModules();
//     vi.clearAllMocks();
//     fromMock.mockReset();
//     createAuditLogMock.mockResolvedValue(undefined);
//     sendMailMock.mockResolvedValue(undefined);
//   });

//   it("allows only admin to delete issues", async () => {
//     const { createApp } = await import("./app");
//     const app = createApp();

//     const viewerRes = await request(app, "/issues/issue-1", {
//       method: "DELETE",
//       headers: {
//         "x-test-role": "viewer",
//       },
//     });

//     expect(viewerRes.status).toBe(403);

//     fromMock.mockImplementation(
//       createFromMockImplementation((state) => {
//         if (state.table === "issues" && state.operation === "select") {
//           return { data: { id: "issue-1", title: "Test issue" }, error: null };
//         }

//         if (state.table === "issues" && state.operation === "delete") {
//           return { error: null };
//         }

//         return { data: null, error: null };
//       }),
//     );

//     const adminRes = await request(app, "/issues/issue-1", {
//       method: "DELETE",
//       headers: {
//         "x-test-role": "admin",
//       },
//     });

//     expect(adminRes.status).toBe(200);
//     await expect(adminRes.json()).resolves.toEqual({ message: "Issue deleted" });
//     expect(createAuditLogMock).toHaveBeenCalled();
//   });

//   it("forbids viewers from creating issues", async () => {
//     const { createApp } = await import("./app");
//     const app = createApp();

//     const res = await request(app, "/issues", {
//       method: "POST",
//       headers: {
//         "x-test-role": "viewer",
//       },
//       body: JSON.stringify({
//         title: "New issue",
//         description: "Description",
//         dueDate: "2026-04-01",
//       }),
//     });

//     expect(res.status).toBe(403);
//   });

//   it("rejects empty comments", async () => {
//     const { createApp } = await import("./app");
//     const app = createApp();

//     const res = await request(app, "/issues/issue-1/comments", {
//       method: "POST",
//       headers: {
//         "x-test-role": "member",
//       },
//       body: JSON.stringify({
//         comment: "   ",
//       }),
//     });

//     expect(res.status).toBe(400);
//     await expect(res.json()).resolves.toEqual({
//       error: "comment is required",
//     });
//   });

//   it("toggles issue status from open to resolved", async () => {
//     fromMock.mockImplementation(
//       createFromMockImplementation((state) => {
//         if (state.table === "issues" && state.operation === "select") {
//           return { data: { status: "open", title: "Test issue" }, error: null };
//         }

//         if (state.table === "profiles" && state.operation === "select") {
//           return { data: { display_name: "Tester" }, error: null };
//         }

//         if (state.table === "issues" && state.operation === "update") {
//           return {
//             data: {
//               id: "issue-1",
//               title: "Test issue",
//               status: "resolved",
//               resolved_by: "user-1",
//               resolved_at: "2026-04-01T00:00:00.000Z",
//             },
//             error: null,
//           };
//         }

//         return { data: null, error: null };
//       }),
//     );

//     const { createApp } = await import("./app");
//     const app = createApp();

//     const res = await request(app, "/issues/issue-1/resolve", {
//       method: "PATCH",
//       headers: {
//         "x-test-role": "member",
//       },
//     });

//     expect(res.status).toBe(200);
//     const body = await res.json();
//     expect(body.issue.status).toBe("resolved");
//     expect(createAuditLogMock).toHaveBeenCalledWith(
//       expect.objectContaining({
//         action: "issue.resolve",
//       }),
//     );
//   });

//   it("toggles issue status from resolved to open", async () => {
//     fromMock.mockImplementation(
//       createFromMockImplementation((state) => {
//         if (state.table === "issues" && state.operation === "select") {
//           return { data: { status: "resolved", title: "Test issue" }, error: null };
//         }

//         if (state.table === "profiles" && state.operation === "select") {
//           return { data: { display_name: "Tester" }, error: null };
//         }

//         if (state.table === "issues" && state.operation === "update") {
//           return {
//             data: {
//               id: "issue-1",
//               title: "Test issue",
//               status: "open",
//               resolved_by: null,
//               resolved_at: null,
//             },
//             error: null,
//           };
//         }

//         return { data: null, error: null };
//       }),
//     );

//     const { createApp } = await import("./app");
//     const app = createApp();

//     const res = await request(app, "/issues/issue-1/resolve", {
//       method: "PATCH",
//       headers: {
//         "x-test-role": "member",
//       },
//     });

//     expect(res.status).toBe(200);
//     const body = await res.json();
//     expect(body.issue.status).toBe("open");
//     expect(createAuditLogMock).toHaveBeenCalledWith(
//       expect.objectContaining({
//         action: "issue.reopen",
//       }),
//     );
//   });
// });
