import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StrategyConfirmationModal from "./StrategyConfirmationModal";

// Mock dependencies
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "test-user-123" },
  }),
}));

describe("StrategyConfirmationModal", () => {
  const mockOnClose = vi.fn();
  const mockOnRequestUpdate = vi.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onRequestUpdate: mockOnRequestUpdate,
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
    // Mock window.dispatchEvent
    vi.spyOn(window, "dispatchEvent");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("restore functionality", () => {
    it("should remove localStorage item when restore is clicked", () => {
      const userId = "test-user-123";
      const storageKey = `strategy_modal_skipped_${userId}`;

      // Set initial minimized state
      localStorage.setItem(storageKey, "true");

      // Force modal to show minimized state by setting isOpen but having localStorage item
      render(<StrategyConfirmationModal {...defaultProps} />);

      // Modal should show minimized version
      const restoreButton = screen.getByText("strategyModal.restore");
      expect(restoreButton).toBeDefined();

      // Click restore
      fireEvent.click(restoreButton);

      // Verify localStorage item was removed
      expect(localStorage.getItem(storageKey)).toBeNull();
    });

    it("should dispatch strategy-modal-restored event when restore is clicked", () => {
      const userId = "test-user-123";
      const storageKey = `strategy_modal_skipped_${userId}`;

      // Set initial minimized state
      localStorage.setItem(storageKey, "true");

      render(<StrategyConfirmationModal {...defaultProps} />);

      const restoreButton = screen.getByText("strategyModal.restore");
      fireEvent.click(restoreButton);

      // Verify strategy-modal-restored event was dispatched
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "strategy-modal-restored",
        }),
      );
    });

    it("should dispatch force-strategy-modal-open event when restore is clicked", () => {
      const userId = "test-user-123";
      const storageKey = `strategy_modal_skipped_${userId}`;

      localStorage.setItem(storageKey, "true");

      render(<StrategyConfirmationModal {...defaultProps} />);

      const restoreButton = screen.getByText("strategyModal.restore");
      fireEvent.click(restoreButton);

      // Verify force-strategy-modal-open event was dispatched
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "force-strategy-modal-open",
        }),
      );
    });

    it("should dispatch both events in correct order when restore is clicked", () => {
      const userId = "test-user-123";
      const storageKey = `strategy_modal_skipped_${userId}`;

      localStorage.setItem(storageKey, "true");

      render(<StrategyConfirmationModal {...defaultProps} />);

      const restoreButton = screen.getByText("strategyModal.restore");

      // Clear previous calls
      vi.mocked(window.dispatchEvent).mockClear();

      fireEvent.click(restoreButton);

      // Verify both events were dispatched
      const calls = vi.mocked(window.dispatchEvent).mock.calls;
      expect(calls).toHaveLength(2);
      expect(calls[0][0].type).toBe("strategy-modal-restored");
      expect(calls[1][0].type).toBe("force-strategy-modal-open");
    });
  });

  describe("skip/minimize functionality", () => {
    it("should set localStorage item when skip is clicked", () => {
      const userId = "test-user-123";
      const storageKey = `strategy_modal_skipped_${userId}`;

      render(<StrategyConfirmationModal {...defaultProps} />);

      const skipButton = screen.getByText("strategyModal.hideForNow");
      fireEvent.click(skipButton);

      // Verify localStorage item was set
      expect(localStorage.getItem(storageKey)).toBe("true");
    });

    it("should call onClose when skip is clicked", () => {
      render(<StrategyConfirmationModal {...defaultProps} />);

      const skipButton = screen.getByText("strategyModal.hideForNow");
      fireEvent.click(skipButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("modal visibility", () => {
    it("should not render when isOpen is false", () => {
      const { container } = render(
        <StrategyConfirmationModal {...defaultProps} isOpen={false} />,
      );

      // Modal should not be in the document
      expect(container.firstChild).toBeNull();
    });

    it("should render full modal when isOpen is true and not minimized", () => {
      render(<StrategyConfirmationModal {...defaultProps} />);

      // Should show full modal content
      expect(screen.getByText("strategyModal.title")).toBeDefined();
      expect(screen.getByText("strategyModal.checkStrategy")).toBeDefined();
    });

    it("should render minimized view when localStorage has skip flag", () => {
      const userId = "test-user-123";
      const storageKey = `strategy_modal_skipped_${userId}`;

      // Set minimized state before rendering
      localStorage.setItem(storageKey, "true");

      render(<StrategyConfirmationModal {...defaultProps} />);

      // Should show minimized view
      expect(screen.getByText("strategyModal.minimized")).toBeDefined();
      expect(screen.getByText("strategyModal.restore")).toBeDefined();

      // Should NOT show full modal content
      expect(screen.queryByText("strategyModal.checkStrategy")).toBeNull();
    });
  });

  describe("request update functionality", () => {
    it("should call onRequestUpdate when check strategy button is clicked", () => {
      render(<StrategyConfirmationModal {...defaultProps} />);

      const checkStrategyButton = screen.getByText(
        "strategyModal.checkStrategy",
      );
      fireEvent.click(checkStrategyButton);

      expect(mockOnRequestUpdate).toHaveBeenCalledTimes(1);
    });

    it("should disable check strategy button when loading", () => {
      render(<StrategyConfirmationModal {...defaultProps} loading={true} />);

      const button = screen.getByText("strategyModal.processing");
      expect(button.closest("button").disabled).toBe(true);
    });
  });

  describe("close button functionality", () => {
    it("should call onClose when X button is clicked", () => {
      render(<StrategyConfirmationModal {...defaultProps} />);

      // Modal is rendered via portal to document.body
      const closeButton = document.querySelector(".modal-close-btn");
      expect(closeButton).not.toBeNull();

      fireEvent.click(closeButton);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose when clicking overlay background", () => {
      render(<StrategyConfirmationModal {...defaultProps} />);

      // Modal is rendered via portal to document.body
      const overlay = document.querySelector(".modal-overlay");
      expect(overlay).not.toBeNull();

      // Simulate click on overlay itself (not on modal content)
      // The onClick handler checks if e.target === e.currentTarget
      const clickEvent = new MouseEvent("click", { bubbles: true });
      Object.defineProperty(clickEvent, "target", {
        value: overlay,
        enumerable: true,
      });
      Object.defineProperty(clickEvent, "currentTarget", {
        value: overlay,
        enumerable: true,
      });

      overlay.dispatchEvent(clickEvent);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
