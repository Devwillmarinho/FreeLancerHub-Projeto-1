/**
 * @jest-environment node
 */
import { PUT } from "@/app/api/proposals/[id]/route";
import { createRequest } from "node-mocks-http";

jest.mock("next/headers", () => ({
  cookies: () => new Map(),
}));

const mockGetUser = jest.fn();
const mockRpc = jest.fn();

jest.mock("@supabase/auth-helpers-nextjs", () => ({
  createRouteHandlerClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    rpc: mockRpc,
  }),
}));

describe("API /api/proposals/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deve atualizar o status de uma proposta para 'accepted' com sucesso", async () => {
    // Arrange
    const proposalId = "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6";
    const companyUserId = "company-user-id";

    mockGetUser.mockResolvedValue({ data: { user: { id: companyUserId } } });
    mockRpc.mockResolvedValue({
      data: { id: proposalId, status: "accepted" },
      error: null,
    });

    const req = createRequest({
      method: "PUT",
      json: () => Promise.resolve({ status: "accepted" }),
    });

    // Act
    const res = await PUT(req as any, { params: { id: proposalId } });
    const json = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(json.id).toBe(proposalId);
    expect(json.status).toBe("accepted");
    expect(mockRpc).toHaveBeenCalledWith("update_proposal_status", {
      proposal_id_to_update: proposalId,
      new_status: "accepted",
      company_id_check: companyUserId,
    });
  });

  it("deve retornar 400 se o status for inválido", async () => {
    // Arrange
    const proposalId = "a1b2c3d4-e5f6-a7b8-c9d0-e1f2a3b4c5d6";
    mockGetUser.mockResolvedValue({ data: { user: { id: "any-user-id" } } });

    const req = createRequest({
      method: "PUT",
      json: () => Promise.resolve({ status: "invalid_status" }),
    });

    // Act
    const res = await PUT(req as any, { params: { id: proposalId } });
    const json = await res.json();

    // Assert
    expect(res.status).toBe(400);
    expect(json.errors).toHaveProperty("status");
  });
});
