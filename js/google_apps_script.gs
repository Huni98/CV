/**
 * ============================================================================
 * GOOGLE APPS SCRIPT KÓD A CV KAPCSOLATFELVÉTELI ŰRLAPHOZ
 * ============================================================================
 * Beállítási lépések (kb. 1 perc):
 * 1. Nyisd meg: https://script.google.com/ és kattints az "Új projekt" (New project) gombra.
 * 2. Töröld ki az ott lévő üres `function myFunction() {}` részt, és másold be
 *    ezt a teljes fájlt!
 * 3. Kattints felül a "Mentés" (Save / 💾) ikonra.
 * 4. Kattints jobb felül a kék "Közzététel" (Deploy) -> "Új közzététel" (New deployment) gombra.
 * 5. A bal oldali fogaskerék (Select type) ikonnál válaszd a "Webalkalmazás" (Web app) típust:
 *    - Leírás (Description): CV Contact Form
 *    - Futtatás mint (Execute as): Én (Me)
 *    - Ki férhet hozzá (Who has access): Bárki (Anyone)  <-- NAGYON FONTOS!
 * 6. Kattints a "Közzététel" (Deploy) gombra, majd engedélyezd a hozzáférést
 *    (Hitelesítés / Authorize access -> válaszd a Google fiókod -> Speciális / Advanced ->
 *    Tovább a projekthez (nem biztonságos) / Go to Untitled project -> Engedélyezés / Allow).
 * 7. Másold ki a kapott "Webalkalmazás URL-címe" (Web app URL) linket
 *    (ami így néz ki: https://script.google.com/macros/s/AKfycb.../exec)
 *    és küldd el nekem, vagy illeszd be a `js/main.js` fájlban a GOOGLE_SCRIPT_URL változóba!
 * ============================================================================
 */

function doPost(e) {
  try {
    var params = e.parameter || {};

    // Ha JSON formátumban érkezett az adat, azt is feldolgozzuk
    if (e.postData && e.postData.contents) {
      try {
        var jsonData = JSON.parse(e.postData.contents);
        for (var key in jsonData) {
          params[key] = jsonData[key];
        }
      } catch (err) {
        // Nem JSON, marad az e.parameter (URLSearchParams / FormData)
      }
    }

    // 1. Invisible Captcha / Honeypot ellenőrzés
    var honey = params._honey || params._honeypot || "";
    if (honey.toString().trim() !== "") {
      return ContentService.createTextOutput(JSON.stringify({
        result: "error",
        message: "Spam gyanúja miatt elutasítva."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var name = (params.name || params.Name || "Érdeklődő").toString().trim();
    var senderEmail = (params.email || params.Email || "").toString().trim();
    var message = (params.message || params.Message || "").toString().trim();

    if (!senderEmail || !message) {
      return ContentService.createTextOutput(JSON.stringify({
        result: "error",
        message: "Hiányzó e-mail cím vagy üzenet!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. E-mail küldése NEKED (Madaras Hunor)
    var ownerEmail = "hunormadaras@yahoo.com";
    var ownerSubject = "Új megkeresés a CV weboldalról: " + name;
    var ownerBody =
      "Új üzenet érkezett a CV weboldalad kapcsolatfelvételi űrlapjáról!\n\n" +
      "--------------------------------------------------\n" +
      "Küldő neve: " + name + "\n" +
      "Küldő e-mail címe: " + senderEmail + "\n" +
      "--------------------------------------------------\n\n" +
      "Üzenet:\n" + message + "\n\n" +
      "--------------------------------------------------\n" +
      "Tipp: Ha erre a levélre a 'Válasz' (Reply) gombbal válaszolsz, egyből a küldőnek (" + senderEmail + ") írsz.";

    MailApp.sendEmail({
      to: ownerEmail,
      replyTo: senderEmail,
      name: "CV Weboldal Kapcsolat",
      subject: ownerSubject,
      body: ownerBody
    });

    // 3. Automatikus visszaigazoló e-mail küldése ANNAK, AKI KITÖLTÖTTE az űrlapot
    var senderSubject = "Visszaigazolás: Üzenetedet megkaptam - Madaras Hunor";
    var senderBody =
      "Kedves " + name + "!\n\n" +
      "Köszönöm szépen a megkeresést! Üzenetedet sikeresen megkaptam a CV weboldalamon keresztül, és hamarosan felveszem veled a kapcsolatot.\n\n" +
      "Az általad küldött üzenet másolata:\n" +
      "--------------------------------------------------\n" +
      message + "\n" +
      "--------------------------------------------------\n\n" +
      "Üdvözlettel,\n" +
      "Madaras Hunor\n" +
      "Junior Webfejlesztő & Informatika Hallgató\n" +
      "Weboldal: https://huni98.github.io/CV/\n" +
      "E-mail: hunormadaras@yahoo.com";

    MailApp.sendEmail({
      to: senderEmail,
      replyTo: ownerEmail,
      name: "Madaras Hunor",
      subject: senderSubject,
      body: senderBody
    });

    return ContentService.createTextOutput(JSON.stringify({
      result: "success",
      message: "Mindkét e-mail sikeresen elküldve!"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
