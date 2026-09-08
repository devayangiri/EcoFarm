import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AIChatView } from "@/components/ai/ai-chat-view";

const mockBack = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

describe("AIChatView Component", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should render chat header, brand, online status, and input field", () => {
    render(<AIChatView userRole="FARMER" userName="Ramesh" />);

    expect(screen.getByText("EcoFarm AI")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Ask EcoFarm AI about crops, fish/i)
    ).toBeInTheDocument();
  });

  it("should render role-tailored prompt suggestions for FARMER", () => {
    render(<AIChatView userRole="FARMER" userName="Ramesh" />);

    expect(screen.getByText(/What are the main causes of yellow leaves in paddy\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Fish pond water quality and dissolved oxygen advice/i)).toBeInTheDocument();
  });

  it("should render role-tailored prompt suggestions for BUYER", () => {
    render(<AIChatView userRole="BUYER" userName="Amit" />);

    expect(screen.getByText(/Find products for bulk procurement on EcoFarm/i)).toBeInTheDocument();
    expect(screen.getByText(/How does MOQ work in wholesale trade\?/i)).toBeInTheDocument();
  });

  it("should send prompt immediately when prompt pill is clicked", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: "Yellow leaves in paddy are often caused by Nitrogen deficiency or Zinc deficiency.",
        sessionId: "test-sess-1",
      }),
    });

    render(<AIChatView userRole="FARMER" userName="Ramesh" />);

    const promptPill = screen.getByText(/What are the main causes of yellow leaves in paddy\?/i);
    fireEvent.click(promptPill);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/ai/chat",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Yellow leaves in paddy are often caused by Nitrogen deficiency/i)
      ).toBeInTheDocument();
    });
  });

  it("should display error banner and retry button if API fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        message: "EcoFarm AI is temporarily unavailable. Please try again.",
      }),
    });

    render(<AIChatView userRole="GUEST" />);

    const input = screen.getByPlaceholderText(/Ask EcoFarm AI/i);
    fireEvent.change(input, { target: { value: "Test error trigger" } });

    const sendButton = screen.getByRole("button", { name: /Send question/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(
        screen.getByText(/EcoFarm AI is temporarily unavailable. Please try again./i)
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
    });
  });

  it("should clear conversation and reset when '+ New Chat' is clicked", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        message: "First answer",
        sessionId: "sess-1",
      }),
    });

    render(<AIChatView userRole="FARMER" />);

    const input = screen.getByPlaceholderText(/Ask EcoFarm AI/i);
    fireEvent.change(input, { target: { value: "First question" } });
    fireEvent.click(screen.getByRole("button", { name: /Send question/i }));

    await waitFor(() => {
      expect(screen.getByText("First answer")).toBeInTheDocument();
    });

    const newChatButton = screen.getByRole("button", { name: /New Chat/i });
    fireEvent.click(newChatButton);

    // Initial greeting is back, user message is cleared
    expect(screen.queryByText("First question")).not.toBeInTheDocument();
    expect(screen.queryByText("First answer")).not.toBeInTheDocument();
  });
});
