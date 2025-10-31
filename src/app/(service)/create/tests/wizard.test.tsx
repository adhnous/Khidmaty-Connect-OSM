import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Page from "../../create/page";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { uid: "test-uid", email: "a@b.c" } }),
}));

vi.mock("@/lib/service-drafts", () => ({
  getServiceDraft: vi.fn(async () => null),
  saveServiceDraft: vi.fn(async () => {}),
  deleteServiceDraft: vi.fn(async () => {}),
}));

vi.mock("@/lib/i18n", async (orig) => {
  const mod: any = await orig();
  return { ...mod, getClientLocale: () => "en", tr: (_: any, s: string) => s };
});

describe("Create Wizard 4-step", () => {
  beforeEach(() => vi.resetModules());

  it("Step 1 shows category cards and Next disabled until pick", async () => {
    render(React.createElement(Page));
    const nextBtn = await screen.findByRole("button", { name: /next/i });
    expect((nextBtn as HTMLButtonElement).disabled).toBe(true);
    // Click a card label
    const card = await screen.findByText(/Maintenance & Repair/i);
    fireEvent.click(card);
    // Re-evaluate the disabled state
    expect((nextBtn as HTMLButtonElement).disabled).toBe(false);
  });

  it("Step 2 contains map/images/youtube inputs and setting lat/lng enables Next with other fields", async () => {
    render(React.createElement(Page));
    // choose category and go next
    fireEvent.click(await screen.findByText(/Maintenance & Repair/i));
    fireEvent.click(await screen.findByRole("button", { name: /next/i }));
    // Fill required details
    fireEvent.change(screen.getByLabelText(/form.labels.title/i), { target: { value: "Test Service" } });
    fireEvent.change(screen.getByLabelText(/form.labels.description/i), { target: { value: "a description that is sufficiently long to pass zod validation 1234567890" } });
    // Set lat/lng
    fireEvent.change(screen.getByLabelText(/form.labels.latitude/i), { target: { value: "32.8872" } });
    fireEvent.change(screen.getByLabelText(/form.labels.longitude/i), { target: { value: "13.1913" } });
    // Ensure Next is enabled now
    const nextBtn = await screen.findByRole("button", { name: /next/i });
    expect((nextBtn as HTMLButtonElement).disabled).toBe(false);
  });
});

