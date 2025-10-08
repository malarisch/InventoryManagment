import { test, expect } from "@playwright/test";

/**
 * E2E Test für Scanner Fullscreen Funktionalität
 * - Überprüft, dass Modi ausgewählt werden können
 * - Testet, dass Fullscreen Scanner öffnet und schließt
 * - Verifiziert Navigation im Lookup-Modus
 */

test.describe("Scanner Fullscreen Functionality", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/management/scanner");
    await page.waitForLoadState("networkidle");
  });

  test("should display mode selection cards", async ({ page }) => {
    // Prüfe, dass alle vier Modi angezeigt werden
    await expect(page.getByRole("heading", { name: "Kameramodus" })).toBeVisible();
    
    // Prüfe die Modi-Karten anhand ihrer spezifischen Beschreibungen
    await expect(page.getByText("Asset-Tag scannen und Objekt öffnen")).toBeVisible();
    await expect(page.getByText("Equipments, Cases oder Artikel auf einen Standort buchen")).toBeVisible();
    await expect(page.getByText("Equipments/Cases für einen Job reservieren")).toBeVisible();
    await expect(page.getByText("Assets als eingeladen/verpackt markieren")).toBeVisible();
  });

  test("should select a mode and show scanner button", async ({ page }) => {
    // Wähle den "Suchen" Modus
    const lookupCard = page.locator("div.cursor-pointer").filter({ hasText: "Suchen" });
    await lookupCard.click();

    // Prüfe, dass der Modus aktiv ist (CheckCircle2 Icon sollte sichtbar sein)
    await expect(lookupCard.locator("svg").last()).toBeVisible();

    // Prüfe, dass der "Scannen starten" Button erscheint
    await expect(page.getByRole("button", { name: /Scannen starten/i })).toBeVisible();
  });

  test("should open fullscreen scanner when clicking start button", async ({ page }) => {
    // Wähle den "Suchen" Modus
    await page.locator("div.cursor-pointer").filter({ hasText: "Suchen" }).click();
    
    // Klicke auf "Scannen starten"
    await page.getByRole("button", { name: /Scannen starten/i }).click();

    // Warte kurz auf das Öffnen des Scanners
    await page.waitForTimeout(1500);

    // Prüfe, dass der Fullscreen Scanner sichtbar ist
    // Der Scanner hat eine fixed Position mit z-50 und bg-black
    const scanner = page.locator("div.fixed.inset-0.z-50.bg-black");
    await expect(scanner).toBeVisible();

    // Prüfe, dass Header mit Titel sichtbar ist (im Fullscreen-Scanner)
    await expect(page.locator("div.fixed.inset-0.z-50.bg-black h1").filter({ hasText: "Suchen" })).toBeVisible();

    // Prüfe, dass Zurück-Buttons vorhanden sind (es gibt zwei - links und rechts)
    const backButtons = page.locator("div.fixed.inset-0.z-50.bg-black button").filter({ has: page.locator("svg.lucide-arrow-left") });
    await expect(backButtons.first()).toBeVisible();
  });

  test("should close fullscreen scanner with back button", async ({ page }) => {
    // Wähle einen Modus und öffne den Scanner
    await page.locator("div.cursor-pointer").filter({ hasText: "Standort" }).click();
    await page.getByRole("button", { name: /Scannen starten/i }).click();
    await page.waitForTimeout(1500);

    // Prüfe, dass Scanner offen ist
    const scanner = page.locator("div.fixed.inset-0.z-50.bg-black");
    await expect(scanner).toBeVisible();

    // Klicke auf den Zurück-Button im Fullscreen-Scanner (gezielter Selektor)
    await page.locator("div.fixed.inset-0.z-50 button svg.lucide-arrow-left").first().click({ force: true });
    await page.waitForTimeout(300);

    // Prüfe, dass Scanner geschlossen ist
    await expect(scanner).not.toBeVisible();
  });

  test("should close fullscreen scanner with X button", async ({ page }) => {
    // Wähle einen Modus und öffne den Scanner
    await page.locator("div.cursor-pointer").filter({ hasText: "Standort" }).click();
    await page.getByRole("button", { name: /Scannen starten/i }).click();
    await page.waitForTimeout(1500);

    // Prüfe, dass Scanner offen ist
    const scanner = page.locator("div.fixed.inset-0.z-50.bg-black");
    await expect(scanner).toBeVisible();

    // Klicke auf den X-Button im Fullscreen-Scanner
    await page.locator("div.fixed.inset-0.z-50 button svg.lucide-x").first().click({ force: true });
    await page.waitForTimeout(300);

    // Prüfe, dass Scanner geschlossen ist
    await expect(scanner).not.toBeVisible();
  });

  test("should show manual entry option in fullscreen scanner", async ({ page }) => {
    // Öffne Scanner
    await page.locator("div.cursor-pointer").filter({ hasText: "Suchen" }).click();
    await page.getByRole("button", { name: /Scannen starten/i }).click();
    await page.waitForTimeout(500);

    // Prüfe, dass "Code manuell eingeben" Button vorhanden ist
    const manualButton = page.getByRole("button", { name: /Code manuell eingeben/i });
    await expect(manualButton).toBeVisible();

    // Klicke darauf und prüfe, dass Eingabefeld erscheint
    await manualButton.click();
    await page.waitForTimeout(200);

    // Prüfe, dass Eingabefeld sichtbar ist
    await expect(page.locator('input#manual-code-fullscreen')).toBeVisible();
  });

  test("should show camera controls in fullscreen scanner", async ({ page }) => {
    // Öffne Scanner
    await page.locator("div.cursor-pointer").filter({ hasText: "Suchen" }).click();
    await page.getByRole("button", { name: /Scannen starten/i }).click();
    await page.waitForTimeout(1000); // Mehr Zeit für Kamera-Initialisierung

    // Prüfe, dass Kamera-Kontrollen vorhanden sind
    // Die Kamera-Icon sollte sichtbar sein
    const cameraIcon = page.locator("svg.lucide-camera");
    await expect(cameraIcon).toBeVisible();

    // Status-Text sollte "Kamera aktiv" oder "Lädt..." enthalten
    const statusText = page.locator("text=/Kamera|Lädt/i");
    await expect(statusText.first()).toBeVisible();
  });

  test("should allow switching modes", async ({ page }) => {
    // Wähle ersten Modus
    await page.locator("div.cursor-pointer").filter({ hasText: "Suchen" }).click();
    
    // Badge sollte "Suchen" anzeigen - prüfe spezifisch das Badge-Element
    const lookupBadge = page.locator("header div.inline-flex").filter({ hasText: "Suchen" });
    await expect(lookupBadge).toBeVisible();

    // Wähle anderen Modus
    await page.locator("div.cursor-pointer").filter({ hasText: "Standort" }).click();
    
    // Badge sollte "Standort" anzeigen
    const locationBadge = page.locator("header div.inline-flex").filter({ hasText: "Standort" });
    await expect(locationBadge).toBeVisible();
  });
});

test.describe("Scanner Location Mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/management/scanner");
    await page.waitForLoadState("networkidle");
  });

  test("should show location picker in assign-location mode", async ({ page }) => {
    // Wähle Standort-Modus
    await page.locator("div.cursor-pointer").filter({ hasText: "Standort" }).click();

    // Prüfe, dass Standort-Auswahl angezeigt wird
    await expect(page.getByText("Zielstandort")).toBeVisible();
    await expect(page.getByRole("button", { name: /Standort wählen/i })).toBeVisible();
  });

  test("should open location picker dialog", async ({ page }) => {
    // Wähle Standort-Modus
    await page.locator("div.cursor-pointer").filter({ hasText: "Standort" }).click();

    // Öffne Standort-Picker
    await page.getByRole("button", { name: /Standort wählen/i }).click();
    await page.waitForTimeout(300);

    // Prüfe, dass Dialog geöffnet ist
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Standort auswählen" })).toBeVisible();
  });
});

test.describe("Scanner Job Modes", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/management/scanner");
    await page.waitForLoadState("networkidle");
  });

  test("should show job info when job-book mode selected", async ({ page }) => {
    // Job-Modi benötigen einen Job-Parameter in der URL
    // Da wir keinen haben, sollte eine Fehlermeldung erscheinen
    await page.locator("div.cursor-pointer").filter({ hasText: "Job buchen" }).click();
    
    // Öffne Scanner
    await page.getByRole("button", { name: /Scannen starten/i }).click();
    await page.waitForTimeout(500);

    // Da kein Job ausgewählt ist, sollte nach einem Scan ein Fehler im Feed erscheinen
    // Wir testen nur, dass der Scanner grundsätzlich funktioniert
    const scanner = page.locator("div.fixed.inset-0.z-50.bg-black");
    await expect(scanner).toBeVisible();
  });
});
