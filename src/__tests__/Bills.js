/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import BillsUI from "../views/BillsUI.js";
import Bills from "../containers/Bills.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import { bills } from "../fixtures/bills.js";
import router from "../app/Router.js";
import "@testing-library/jest-dom/extend-expect";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      //check if active-icon class is present for window icon highlighting
      expect(windowIcon.classList.contains("active-icon")).toBe(true);
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });
});

// Tests pour la page des factures
describe("When I'm on the bills page", () => {
  // Initialisation avant chaque test
  beforeEach(() => {
    //fonction de navigation vers une autre page
    const onNavigate = (pathname) => {
      document.body.innerHTML = ROUTES({ pathname });
    };
    // Chargement du contenu de la page des factures avec les données fournies
    document.body.innerHTML = BillsUI({ data: bills });
    // Initialisation de l'objet "Bills" pour gérer la page
    new Bills({
      document,
      onNavigate,
      store: mockStore,
      localStorage: window.localStorage,
    });
  });

  // Tests pour le bouton de nouvelle facture
  describe("When I click on the New Bill button", () => {
    // Test pour vérifier que la page de nouvelle facture s'ouvre
    test("Then the new bill page should open", () => {
      // Simulation du clic sur le bouton "btn-new-bill"
      userEvent.click(screen.getByTestId("btn-new-bill"));
      // Vérification que le texte "Envoyer une note de frais" est présent sur la page
      expect(screen.getByText("Envoyer une note de frais")).toBeInTheDocument();
      // Vérification que le formulaire de nouvelle facture est présent sur la page
      expect(screen.getByTestId("form-new-bill")).toBeInTheDocument();
    });
  });

  // Tests pour l'icône oeil
  describe("When I click on the eye icon", () => {
    // Test pour vérifier que le justificatif s'affiche
    test("Then the receipt should open", () => {
      // Mock de la fonction modal pour l'affichage du justificatif
      $.fn.modal = jest.fn();
      // Simulation du clic sur la première icône oeil de la liste
      userEvent.click(screen.getAllByTestId("icon-eye")[0]);
      // Vérification que le texte "Justificatif" est présent sur la page
      expect(screen.getByText("Justificatif")).toBeInTheDocument();
    });
  });
});
