import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useNextMonthQuota } from "./useNextMonthQuota";
import * as strategyHelpers from "../utils/strategyHelpers";
import { useAuth } from "../contexts/AuthContext";
import { getUserOrgId } from "../lib/getUserOrgId";
import { supabase } from "../lib/supabase";

// Mock dependencies
vi.mock("../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("../lib/getUserOrgId", () => ({
  getUserOrgId: vi.fn(),
}));

vi.mock("../utils/strategyHelpers", () => ({
  findNextMonthStrategy: vi.fn(),
  calculateMonthlyLimit: vi.fn(),
}));

describe("useNextMonthQuota", () => {
  const mockUser = { id: "user-123" };
  const mockUserId = "org-456";

  let mockSupabaseQuery;

  beforeEach(() => {
    vi.clearAllMocks();

    // Re-create mock query chain after clearAllMocks
    mockSupabaseQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({
          data: { subscription_status: "free" },
          error: null,
        }),
      head: true,
      count: "exact",
    };

    vi.mocked(useAuth).mockReturnValue({ user: mockUser });
    vi.mocked(getUserOrgId).mockResolvedValue(mockUserId);
    vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery);
    vi.mocked(strategyHelpers.calculateMonthlyLimit).mockReturnValue(30);
    vi.mocked(strategyHelpers.findNextMonthStrategy).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with default values", async () => {
    const { result } = renderHook(() => useNextMonthQuota());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.nextMonthCount).toBe(0);
    expect(result.current.nextMonthLimit).toBe(30);
    expect(result.current.nextMonthRemaining).toBe(30);
    expect(result.current.subscriptionStatus).toBe("free");
    expect(result.current.isUnlimited).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should not fetch data if user is not available", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null });

    renderHook(() => useNextMonthQuota());

    await waitFor(() => {
      expect(getUserOrgId).not.toHaveBeenCalled();
    });
  });

  it("should fetch subscription status and calculate limit", async () => {
    const mockUserData = { subscription_status: "pro" };
    mockSupabaseQuery.single.mockResolvedValue({
      data: mockUserData,
      error: null,
    });

    vi.mocked(strategyHelpers.calculateMonthlyLimit).mockReturnValue(100);
    vi.mocked(strategyHelpers.findNextMonthStrategy).mockResolvedValue(null);

    const { result } = renderHook(() => useNextMonthQuota());

    await waitFor(() => {
      expect(strategyHelpers.calculateMonthlyLimit).toHaveBeenCalledWith("pro");
      expect(result.current.nextMonthLimit).toBe(100);
    });
  });

  it("should handle error when user data not found", async () => {
    mockSupabaseQuery.single.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    const { result } = renderHook(() => useNextMonthQuota());

    await waitFor(() => {
      expect(result.current.error).toBe("Käyttäjän tietoja ei löytynyt");
      expect(result.current.loading).toBe(false);
    });
  });

  it("should handle error when user ID not found", async () => {
    vi.mocked(getUserOrgId).mockResolvedValue(null);

    const { result } = renderHook(() => useNextMonthQuota());

    await waitFor(() => {
      expect(result.current.error).toBe("Käyttäjän ID ei löytynyt");
      expect(result.current.loading).toBe(false);
    });
  });

  it("should calculate remaining quota correctly", async () => {
    const mockUserData = { subscription_status: "free" };
    mockSupabaseQuery.single.mockResolvedValue({
      data: mockUserData,
      error: null,
    });

    vi.mocked(strategyHelpers.calculateMonthlyLimit).mockReturnValue(30);
    vi.mocked(strategyHelpers.findNextMonthStrategy).mockResolvedValue(null);

    const { result } = renderHook(() => useNextMonthQuota());

    await waitFor(() => {
      expect(result.current.nextMonthLimit).toBe(30);
      expect(result.current.nextMonthRemaining).toBe(30);
    });
  });

  it("should handle enterprise unlimited plan", async () => {
    const mockUserData = { subscription_status: "enterprise" };
    mockSupabaseQuery.single.mockResolvedValue({
      data: mockUserData,
      error: null,
    });

    vi.mocked(strategyHelpers.calculateMonthlyLimit).mockReturnValue(999999);
    vi.mocked(strategyHelpers.findNextMonthStrategy).mockResolvedValue(null);

    const { result } = renderHook(() => useNextMonthQuota());

    await waitFor(() => {
      expect(result.current.nextMonthLimit).toBe(999999);
      expect(result.current.isUnlimited).toBe(true);
      expect(result.current.nextMonthRemaining).toBe(Infinity);
    });
  });

  it("should provide refresh function", () => {
    const { result } = renderHook(() => useNextMonthQuota());

    expect(result.current.refresh).toBeDefined();
    expect(typeof result.current.refresh).toBe("function");
  });
});
