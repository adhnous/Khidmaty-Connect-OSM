import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Under test
import Page from "../../create/page";

// Mocks
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
  return {
    ...mod,
    getClientLocale: () => "en",
    tr: (_: any, __: string) => __, // identity for keys used from common/form
  };
});

describe("Create Service Wizard", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("disables Next on Step 1 until required fields are valid", async () => {
    render(React.createElement(Page));
    const nextBtn = await screen.findByRole("button", { name: /next/i });
    expect((nextBtn as HTMLButtonElement).disabled).toBe(true);

    // Fill minimal required fields
    const title = screen.getByLabelText(/Service Title/i);
    fireEvent.change(title, { target: { value: "Test Service" } });
    const desc = screen.getByLabelText(/Description/i);
    fireEvent.change(desc, { target: { value: "This is a sample description with sufficient length." } });
    // Category uses combobox component; skip interaction and rely on default disabling behaviour here

    // After inputs, Next should still be disabled if category missing
    expect((nextBtn as HTMLButtonElement).disabled).toBe(true);
  });
});

