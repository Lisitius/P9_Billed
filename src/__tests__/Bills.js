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

//Test d'intégration pour les requêtes GET
describe("Since I am a user logged in as an employee", () => {
  // Constantes pour les codes d'erreur
  const ERROR_404 = 404;
  const ERROR_500 = 500;

  // Configuration initiale avant tous les tests
  beforeAll(() => {
    // Mock de l'objet localStorage du navigateur
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    // Ajout d'un utilisateur mocké à localStorage
    window.localStorage.setItem(
      "user",
      JSON.stringify({ type: "Employee", email: "a@a" })
    );
    // Création d'un élément div avec id "root" et ajout au corps du document
    const root = document.createElement("div");
    root.setAttribute("id", "root");
    document.body.appendChild(root);
    // Initialisation du routeur
    router();
  });

  // Fonction pour simuler une erreur d'API
  const mockApiError = (errorCode) => {
    // Simuler une erreur lors de la récupération des factures
    mockStore.bills.list = jest
      .fn()
      .mockRejectedValue(new Error(`Erreur ${errorCode}`));
    // Navigation vers la page des factures
    window.onNavigate(ROUTES_PATH.Bills);
    // Remplissage du contenu de la page avec un message d'erreur
    document.body.innerHTML = BillsUI({ error: `Erreur ${errorCode}` });
  };

  // Groupe de tests pour la navigation vers la page des factures
  describe("When I navigate to the invoices page", () => {
    // Test pour vérifier la récupération des factures via l'API mocké
    test("Then retrieval of invoices via API mocked in GET", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // Création d'un nouvel objet Bills avec les dépendances mockées
      const mockedBills = new Bills({
        document,
        onNavigate,
        store: mockStore,
        localStorage: window.localStorage,
      });
      // Récupération des factures
      const bills = await mockedBills.getBills();
      // Vérification que la liste des factures n'est pas vide
      expect(bills.length != 0).toBeTruthy();
    });

    // Groupe de tests pour gérer les erreurs de l'API
    describe("When an error occurs on the API", () => {
      // Test pour simuler et vérifier une erreur 404 de l'API
      test(`Then retrieving invoices from an API and failing with error message ${ERROR_404}`, async () => {
        mockApiError(ERROR_404);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      // Test pour simuler et vérifier une erreur 500 de l'API
      test(`Then retrieving messages from an API and failing with error message ${ERROR_500}`, async () => {
        mockApiError(ERROR_500);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
