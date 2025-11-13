import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
let Page: any;

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { uid: "test-uid", email: "a@b.c" }, userProfile: { role: 'provider' }, loading: false }),
}));

vi.mock("@/lib/service-drafts", () => ({
  getServiceDraft: vi.fn(async () => null),
  saveServiceDraft: vi.fn(async () => {}),
  deleteServiceDraft: vi.fn(async () => {}),
}));

vi.mock("@/lib/i18n", async (orig) => {
  const mod: any = await orig();
  return { ...mod, getClientLocale: () => "en", tr: mod.tr };
});

describe("Create Wizard 4-step", () => {
  beforeEach(async () => {
    vi.resetModules();
    Page = (await import("../../create/page")).default;
  });

  it("renders the create wizard header", async () => {
    render(React.createElement(Page));
    const heading = await screen.findByText(/Create Service|إنشاء خدمة/i);
    expect(heading).toBeTruthy();
  });
});

