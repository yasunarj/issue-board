import { beforeEach, describe, it, expect, vi } from "vitest";

vi.mock("./lib/supabase", () => {
  return {
    supabaseAdmin: {},
  }
})

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
  it("GET /health で ok: false を返す", async () => {
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
  });

})
// テストを進める前にbeforeEachについて調べてみる




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
