import { beforeEach, describe, it, expect, vi } from "vitest";
import { createAuditLog } from "./lib/auditLog";

type AppLike = {
  fetch: (request: Request) => Response | Promise<Response>
}

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

const request = async (
  app: AppLike,
  path: string,
  init?: RequestInit
) => {
  const res = app.fetch(new Request(`http://localhost${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers ?? {}
    }
  }))

  return res;
}

const mockTables = (tables: Record<string, unknown>) => {
  fromMock.mockImplementation((table: string) => {
    return (tables[table] ?? {}) as object;
  })
}

const buildIssueSelectFoundMock = () => ({
  select: () => ({
    eq: () => ({
      single: async () => ({
        data: {
          id: "issue-1",
          title: "Test title",
          due_date: "2026-04-10",
          description: "Test description",
          status: "open",
          created_by: "test-user",
        },
        error: null
      })
    })
  })
})

const buildIssueNotFoundMock = () => ({
  select: () => ({
    eq: () => ({
      single: async () => ({
        data: null,
        error: { message: "DB issue not found" }
      })
    })
  })
})

const buildIssueInsertMock = () => ({
  insert: () => ({
    select: () => ({
      single: async () => ({
        data: {
          id: "issue-1",
          title: "Test title",
          description: "Test description",
          due_date: "2026-04-10",
          created_by: "test-user"
        }
      })
    })
  })
})

const buildIssueStatusFoundMock = (status: string) => ({
  select: () => ({
    eq: () => ({
      single: async () => ({
        data: {
          status: status,
        },
        error: null,
      })
    })
  })
})

const buildIssueStatusUpdateResolvedSuccessMock = () => ({
  ...buildIssueStatusFoundMock("open"),
  update: () => ({
    eq: () => ({
      select: () => ({
        single: async () => ({
          data: {
            id: "issue-1",
            title: "Test Issue",
            status: "resolved",
          },
          error: null
        })
      })
    })
  })
})

const buildIssueStatusUpdateOpenSuccessMock = () => ({
  ...buildIssueStatusFoundMock("resolved"),
  update: () => ({
    eq: () => ({
      select: () => ({
        single: async () => ({
          data: {
            id: "issue-1",
            title: "Test Issue",
            status: "open",
          },
          error: null
        })
      })
    })
  })
})

const buildIssueStatusUpdateFailedMock = () => ({
  ...buildIssueStatusFoundMock("open"),
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
})

const buildProfileFoundMock = () => ({
  select: () => ({
    eq: () => ({
      single: async () => ({
        data: { display_name: "user-1" },
        error: null
      })
    })
  })
})

const buildCommentInsertMock = () => ({
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
})

const buildIssueDeleteSuccessMock = () => ({
  ...buildIssueSelectFoundMock(),
  delete: () => ({
    eq: async () => ({
      error: null
    })
  })
})

const buildIssueDeleteFailedMock = () => ({
  ...buildIssueSelectFoundMock(),
  delete: () => ({
    eq: async () => ({
      error: { message: "DB delete failed" },
    })
  })
})

const buildIssueUpdateSuccessMock = () => ({
  ...buildIssueSelectFoundMock(),
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
          error: null,
        })
      })
    })
  })
})

const buildIssueUpdateFailedMock = () => ({
  ...buildIssueSelectFoundMock(),
  update: () => ({
    eq: () => ({
      select: () => ({
        single: async () => ({
          data: null,
          error: { message: "DB update failed" }
        })
      })
    })
  })
})

const buildCommentsListMock = () => ({
  select: () => ({
    eq: () => ({
      order: async () => ({
        data: [{
          id: "comment-1",
          issue_id: "issue-1",
          body: "Test Comment",
        }],
        error: null
      })
    })
  })
})

const buildIssueCommentFoundMock = () => ({
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
  })
})

const buildIssueCommentNotFoundMock = () => ({
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
})

const buildIssueCommentDeleteSuccessMock = () => ({
  ...buildIssueCommentFoundMock(),
  delete: () => ({
    eq: async () => ({
      error: null,
    })
  })
})

const buildIssueCommentDeleteFailedMock = () => ({
  ...buildIssueCommentFoundMock(),
  delete: () => ({
    eq: async () => ({
      error: { message: "Failed to delete comment" }
    })
  })
})

const buildCommentsListFailedMock = () => ({
  select: () => ({
    eq: () => ({
      order: async () => ({
        data: null,
        error: { message: "DB comments not found" }
      })
    })
  })
})

const buildChecksListMock = () => ({
  select: () => ({
    eq: () => ({
      order: async () => ({
        data: [{
          id: "check-1",
          issue_id: "issue-1"
        }],
        error: null,
      })
    })
  })
})

const buildChecksListFailedMock = () => ({
  select: () => ({
    eq: () => ({
      order: async () => ({
        data: null,
        error: { message: "DB checks not found" }
      })
    })
  })
})

const buildExistingCheckNoneMock = () => ({
  select: () => ({
    eq: () => ({
      eq: () => ({
        maybeSingle: async () => ({
          data: null,
          error: null
        })
      })
    })
  })
})

const buildExistingCheckFoundMock = () => ({
  select: () => ({
    eq: () => ({
      eq: () => ({
        maybeSingle: async () => ({
          data: { id: "check-1", issue_id: "issue-1" },
          error: null,
        })
      })
    })
  })
})

const buildCheckInsertSuccessMock = () => ({
  ...buildExistingCheckNoneMock(),
  insert: () => ({
    select: () => ({
      single: async () => ({
        data: {
          id: "check-1",
          issue_id: "issue-1"
        },
        error: null
      })
    })
  })
})

const buildCheckInsertFailedMock = () => ({
  ...buildExistingCheckNoneMock(),
  insert: () => ({
    select: () => ({
      single: async () => ({
        data: null,
        error: { message: "DB failed to create check" }
      })
    })
  })
})

const buildExistingCheckFailedMock = () => ({
  select: () => ({
    eq: () => ({
      eq: () => ({
        maybeSingle: async () => ({
          data: null,
          error: { message: "DB failed to check existing record" },
        })
      })
    })
  })
})



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

    const res = await request(app, "/issues")

    expect(res.status).toBe(401);
  });

  it("viewer は issue を作成できない", async () => {
    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues", {
      method: "POST",
      headers: {
        "x-test-role": "viewer"
      },
      body: JSON.stringify({
        title: "test",
        description: "test",
      })
    })
    expect(res.status).toBe(403);
  })

  it("空コメントは 400 を返す", async () => {
    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1/comments", {
      method: "POST",
      headers: {
        "x-test-role": "member"
      },
      body: JSON.stringify({
        comment: "   ",
      })
    })

    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body).toEqual({
      error: "comment is required",
    })
  });

  it("open → resolved にトグルされる", async () => {
    mockTables({
      issues: buildIssueStatusUpdateResolvedSuccessMock(),
      profiles: buildProfileFoundMock()
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1/resolve", {
      method: "PATCH",
      headers: {
        "x-test-role": "member"
      }
    })

    expect(res.status).toBe(200);

    const body = await res.json() as any;
    expect(body.issue.status).toBe("resolved");

    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: "issue.resolve"
    }));
  });

  it("resolved -> open にトグルされる", async () => {
    mockTables({
      issues: buildIssueStatusUpdateOpenSuccessMock(),
      profiles: buildProfileFoundMock(),
    })
    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1/resolve", {
      method: "PATCH",
      headers: {
        "x-test-role": "member"
      }
    })

    expect(res.status).toBe(200);

    const body = await res.json() as any;

    expect(body.issue.status).toBe("open");
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: "issue.reopen"
    }));
  });

  it("issue が見つからない時 404 を返す", async () => {
    mockTables({ issues: buildIssueNotFoundMock() });

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-999/resolve", {
      method: "PATCH",
      headers: {
        "x-test-role": "member"
      }
    })

    expect(res.status).toBe(404);

    const body = await res.json();

    expect(body).toEqual({
      error: "Issue not found",
    })
  });

  it("update に失敗すると 500 を返す", async () => {
    mockTables({
      issues: buildIssueStatusUpdateFailedMock(),
      profiles: buildProfileFoundMock(),
    })
    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1/resolve", {
      method: "PATCH",
      headers: {
        "x-test-role": "member",
      }
    })

    expect(res.status).toBe(500);

    const body = await res.json();

    expect(body).toEqual({ error: "DB update failed" });

    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("viewer は issue を削除できない", async () => {
    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1", {
      method: "DELETE",
      headers: {
        "x-test-role": "viewer",
      }
    })

    expect(res.status).toBe(403);
    const body = await res.json() as { error: string }
    expect(body.error).toBe("Forbidden");

    expect(fromMock).not.toHaveBeenCalled();
    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("admin は issue を削除できる", async () => {
    mockTables({
      issues: buildIssueDeleteSuccessMock(),
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1", {
      method: "DELETE",
      headers: {
        "x-test-role": "admin",
      }
    })

    expect(res.status).toBe(200);

    const body = await res.json();

    expect(body).toEqual({ message: "Issue deleted" });
    expect(createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: "issue.delete",
    }))
  })

  it("delete に失敗すると 500 を返し auditLog が呼ばれない", async () => {
    mockTables({
      issues: buildIssueDeleteFailedMock(),
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1", {
      method: "DELETE",
      headers: {
        "x-test-role": "admin"
      }
    })

    expect(res.status).toBe(500);

    const body = await res.json() as { error: string };
    expect(body.error).toBe("Failed to delete issue");

    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("delete対象の issue が見つからない時 404 を返し auditLog は呼ばれない", async () => {
    mockTables({ issues: buildIssueNotFoundMock() })
    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1", {
      method: "DELETE",
      headers: {
        "x-test-role": "admin",
      }
    })

    expect(res.status).toBe(404);

    const body = await res.json() as { error: string }

    expect(body.error).toBe("Issue not found");
    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("admin 以外は issue を削除できず 403 を返し auditLog は呼ばれない", async () => {
    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1", {
      method: "DELETE",
      headers: {
        "x-test-role": "member",
      }
    })

    expect(res.status).toBe(403);

    const body = await res.json() as { error: string };
    expect(body.error).toBe("Forbidden");

    expect(fromMock).not.toHaveBeenCalled();
    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("admin 以外は issue を更新できず 403 を返し auditLog は呼ばれない", async () => {
    const { createApp } = await import("./app");
    const app = createApp();
    const res = await request(app, "/issues/issue-1", {
      method: "PATCH",
      headers: {
        "x-test-role": "member",
      }
    })

    expect(res.status).toBe(403);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Forbidden");

    expect(fromMock).not.toHaveBeenCalled();
    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("admin は issue を更新できる", async () => {
    mockTables({
      issues: buildIssueUpdateSuccessMock()
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1", {
      method: "PATCH",
      headers: {
        "x-test-role": "admin"
      },
      body: JSON.stringify({
        title: "Updated title",
        description: "Updated description",
        dueDate: "2026-04-04",
      })
    })

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
    mockTables({ issues: buildIssueNotFoundMock() });

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1", {
      method: "PATCH",
      headers: {
        "x-test-role": "admin"
      },
      body: JSON.stringify({
        title: "Updated title",
        description: "Updated description",
        dueDate: "2026-04-05",
      })
    })

    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Issue not found");

    expect(createAuditLog).not.toHaveBeenCalled();
  });

  it("updateに失敗すると 500 を返し auditLog は呼ばれない", async () => {
    mockTables({
      issues: buildIssueUpdateFailedMock()
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1", {
      method: "PATCH",
      headers: {
        "x-test-role": "admin"
      },
      body: JSON.stringify({
        title: "Updated title",
        description: "Updated description",
        dueDate: "2026-04-05",
      })
    })

    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Failed to update issue");
    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("member は Issue を作成できる", async () => {
    mockTables({
      profiles: buildProfileFoundMock(),
      issues: buildIssueInsertMock()
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues", {
      method: "POST",
      headers: {
        "x-test-role": "member",
      },
      body: JSON.stringify({
        title: "Test title",
        description: "Test description",
        dueDate: "2026-04-10",
      })
    })

    expect(res.status).toBe(201);
    const body = await res.json() as any;

    expect(body.message).toBe("Issue created");
    expect(body.issue.title).toBe("Test title");

    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "issue.create"
      })
    )
    expect(sendMailMock).toHaveBeenCalled();
  })

  it("admin は Issue を作成できる", async () => {
    mockTables({
      profiles: buildProfileFoundMock(),
      issues: buildIssueInsertMock(),
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues", {
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
    })

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.message).toBe("Issue created");
    expect(body.issue.title).toBe("Test title");
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "issue.create" })
    );
    expect(sendMailMock).toHaveBeenCalled();
  })

  it("title が空だと 400 を返し auditLog は呼ばれない", async () => {
    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues", {
      method: "POST",
      headers: {
        "x-test-role": "admin",
      },
      body: JSON.stringify({
        title: "  ",
        description: "Admin description",
        dueDate: "2026-04-10",
      })
    })

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

    const res = await request(app, "/issues", {
      method: "POST",
      headers: {
        "x-test-role": "admin",
      },
      body: JSON.stringify({
        title: "test-title",
        description: "test-description",
        dueDate: "2026-04-05",
      })
    });

    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("DB insert failed");
    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("sendMail が失敗しても issueは作成され 201 を返し auditLog も呼ばれる", async () => {
    sendMailMock.mockRejectedValueOnce(new Error("mail failed"));

    mockTables({
      profiles: buildProfileFoundMock(),
      issues: buildIssueInsertMock()
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues", {
      method: "POST",
      headers: {
        "x-test-role": "admin",
      },
      body: JSON.stringify({
        title: "test-title",
        description: "test-description",
        dueDate: ""
      })
    });

    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.message).toBe("Issue created");
    expect(body.issue.description).toBe("Test description");

    expect(createAuditLog).toHaveBeenCalled();
  })

  it("member はコメントを作成できる", async () => {
    mockTables({
      issues: buildIssueSelectFoundMock(),
      issue_comments: buildCommentInsertMock(),
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1/comments", {
      method: "POST",
      headers: {
        "x-test-role": "member",
      },
      body: JSON.stringify({ comment: "Test comment" })
    });

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

    const res = await request(app, "/issues/issue-2/comments", {
      method: "POST",
      headers: {
        "x-test-role": "viewer",
      },
      body: JSON.stringify("Test comment2")
    })

    expect(res.status).toBe(403);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Forbidden");

    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("issue が存在しない場合コメント作成は 404", async () => {
    mockTables({ issues: buildIssueNotFoundMock() })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-3/comments", {
      method: "POST",
      headers: {
        "x-test-role": "member",
      },
      body: JSON.stringify({ comment: "Test comment" })
    })

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

    const res = await request(app, "/issues/issue-4/comments", {
      method: "POST",
      headers: {
        "x-test-role": "admin",
      },
      body: JSON.stringify({ comment: "Test comment" })
    })

    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Failed to create comment");

    expect(createAuditLog).not.toHaveBeenCalled()
  })

  it("member は comment を取得できる", async () => {
    mockTables({
      issues: buildIssueSelectFoundMock(),
      issue_comments: buildCommentsListMock(),
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1/comments", {
      method: "GET",
      headers: {
        "x-test-role": "member",
      }
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.comments).toHaveLength(1);
    expect(body.comments[0].body).toBe("Test Comment")
  })

  it("comments 取得時に issue が見つからないと 404 を返す", async () => {
    mockTables({ issues: buildIssueNotFoundMock() });

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1/comments", {
      method: "GET",
      headers: {
        "x-test-role": "member",
      }
    });

    expect(res.status).toBe(404);
    const body = await res.json() as { error: string }
    expect(body.error).toBe("Issue not found");
  })

  it("comments 取得失敗時に 500 を返す", async () => {
    mockTables({
      issues: buildIssueSelectFoundMock(),
      issue_comments: buildCommentsListFailedMock()
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1/comments", {
      method: "GET",
      headers: {
        "x-test-role": "member",
      }
    });

    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Failed to fetch comments");
  })

  it("viewer も comments 取得できる", async () => {
    mockTables({
      issues: buildIssueSelectFoundMock(),
      issue_comments: buildCommentsListMock()
    })

    const { createApp } = await import("./app");
    const app = createApp();
    const res = await request(app, "/issues/issue-1/comments", {
      method: "GET",
      headers: {
        "x-test-role": "viewer",
      }
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;

    expect(body.ok).toBe(true);
    expect(body.comments[0].body).toBe("Test Comment");
  })

  it("admin 以外は comment を削除できず 403 を返す", async () => {
    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1/comments/comment-1", {
      method: "DELETE",
      headers: {
        "x-test-role": "member"
      }
    })

    expect(res.status).toBe(403);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Forbidden");
    expect(fromMock).not.toHaveBeenCalled();
    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("admin は comment を削除できる", async () => {
    mockTables({
      issue_comments: buildIssueCommentDeleteSuccessMock(),
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1/comments/comment-1", {
      method: "DELETE",
      headers: {
        "x-test-role": "admin",
      }
    });

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
    mockTables({
      issue_comments: buildIssueCommentNotFoundMock(),
    });

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-4/comments/comment-4", {
      method: "DELETE",
      headers: {
        "x-test-role": "admin"
      }
    })

    expect(res.status).toBe(404)
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Comment not found");
    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("comment の削除に失敗すると 500 を返し auditLog は呼ばれない", async () => {
    mockTables({
      issue_comments: buildIssueCommentDeleteFailedMock(),
    })

    const { createApp } = await import("./app");
    const app = createApp();
    const res = await request(app, "/issues/issue-2/comments/comment-2", {
      method: "DELETE",
      headers: {
        "x-test-role": "admin",
      }
    })

    expect(res.status).toBe(500)
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Failed to delete comment");

    expect(createAuditLog).not.toHaveBeenCalled();
  })

  it("member は checks を取得できる", async () => {
    mockTables({
      issues: buildIssueSelectFoundMock(),
      issue_checks: buildChecksListMock()
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1/checks", {
      method: "GET",
      headers: {
        "x-test-role": "member",
      }
    })

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.ok).toBe(true);
    expect(body.checks[0].id).toBe("check-1");
  });

  it("viewer も checks を取得できる", async () => {
    mockTables({
      issues: buildIssueSelectFoundMock(),
      issue_checks: buildChecksListMock(),
    })

    const { createApp } = await import("./app");
    const app = createApp();
    const res = await request(app, "/issues/issue-1/checks", {
      method: "GET",
      headers: {
        "x-test-role": "viewer",
      }
    })

    expect(res.status).toBe(200);
    const body = await res.json() as any
    expect(body.ok).toBe(true);
    expect(body.checks[0].id).toBe("check-1")
  });

  it("checks取得時に issue が見つからないと 404 を返す", async () => {
    mockTables({ issues: buildIssueNotFoundMock() })

    const { createApp } = await import("./app");
    const app = createApp();
    const res = await request(app, "/issues/issue-1/checks", {
      method: "GET",
      headers: {
        "x-test-role": "member",
      }
    })

    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Issue not found");
  });

  it("checks の取得に失敗すると 500 を返す", async () => {
    mockTables({
      issues: buildIssueSelectFoundMock(),
      issue_checks: buildChecksListFailedMock(),
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1/checks", {
      method: "GET",
      headers: {
        "x-test-role": "member",
      }
    })

    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Failed to fetch checks");
  });

  it("member は issue を check できる", async () => {
    mockTables({
      issues: buildIssueSelectFoundMock(),
      issue_checks: buildCheckInsertSuccessMock(),
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1/check", {
      method: "POST",
      headers: {
        "x-test-role": "member",
      }
    });

    expect(res.status).toBe(201);
    const body = await res.json() as any
    expect(body.message).toBe("Issue checked");
    expect(body.alreadyChecked).toBe(false);
    expect(body.check.id).toBe("check-1");

    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "issue.check" })
    )
  });

  it("viewer も issue を check できる", async () => {
    mockTables({
      issues: buildIssueSelectFoundMock(),
      issue_checks: buildCheckInsertSuccessMock()
    })

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1/check", {
      method: "POST",
      headers: {
        "x-test-role": "viewer",
      }
    });

    expect(res.status).toBe(201);
    const body = await res.json() as any
    expect(body.message).toBe("Issue checked");
    expect(body.alreadyChecked).toBe(false);
    expect(body.check.id).toBe("check-1");

    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: "issue.check" })
    )
  });

  it("check対象の issue が見つからないと 404 を返す", async () => {
    mockTables({ issues: buildIssueNotFoundMock() });

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1/check", {
      method: "POST",
      headers: {
        "x-test-role": "member",
      }
    })

    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Issue not found");
    expect(createAuditLog).not.toHaveBeenCalled();
  });

  it("existing check の確認に失敗すると 500 を返し auditLog は呼ばれない", async () => {
    mockTables({
      issues: buildIssueSelectFoundMock(),
      issue_checks: buildExistingCheckFailedMock(),
    });

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1/check", {
      method: "POST",
      headers: {
        "x-test-role": "member",
      }
    });

    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Failed to check existing record");

    expect(createAuditLog).not.toHaveBeenCalled();
  });

  it("すでに check 済みなら Already checked を返し insert と auditLog は呼ばれない", async () => {
    mockTables({
      issues: buildIssueSelectFoundMock(),
      issue_checks: buildExistingCheckFoundMock()
    })

    const { createApp } = await import("./app");
    const app = createApp();
    const res = await request(app, "/issues/issue-1/check", {
      method: "POST",
      headers: {
        "x-test-role": "member",
      }
    });

    expect(res.status).toBe(200);
    const body = await res.json() as any;
    expect(body.message).toBe("Already checked");
    expect(body.alreadyChecked).toBe(true);

    expect(createAuditLog).not.toHaveBeenCalled();
  });

  it("check の作成に失敗すると 500 を返し auditLog は呼ばれない", async () => {
    mockTables({
      issues: buildIssueSelectFoundMock(),
      issue_checks: buildCheckInsertFailedMock(),
    });

    const { createApp } = await import("./app");
    const app = createApp();

    const res = await request(app, "/issues/issue-1/check", {
      method: "POST",
      headers: {
        "x-test-role": "member",
      }
    })

    expect(res.status).toBe(500);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("Failed to create check");
    expect(createAuditLog).not.toHaveBeenCalled();
  });
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
