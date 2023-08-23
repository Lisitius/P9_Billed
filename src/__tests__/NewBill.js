/**
 * @jest-environment jsdom
 */

import { screen, waitFor, fireEvent } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";
import userEvent from "@testing-library/user-event";
import store from "../__mocks__/store.js";
import "@testing-library/jest-dom/extend-expect";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem("user", JSON.stringify({ type: "Employee" }));

      document.body.innerHTML = '<div id="root"></div>';
      router();
      window.onNavigate(ROUTES_PATH.NewBill);

      await waitFor(() => screen.getByTestId("icon-window"));
      expect(
        screen.getByTestId("icon-mail").classList.contains("active-icon")
      ).toBe(true);
    });

    // Test pour vérifier que la page 'newBill' est bien affichée
    test("Then the 'newBill' page should be displayed", () => {
      const newBillForm = screen.getByTestId("form-new-bill");

      expect(newBillForm).toBeTruthy();
    });

    // Test pour vérifier que le formulaire a bien neuf champs
    test("Then a form with nine fields should render", () => {
      const form = document.querySelector("form");
      expect(form.length).toEqual(9);
    });

    // Test pour vérifier si le gestionnaire de fichier est déclenché lorsqu'un fichier est ajouté.
    describe("When I add an attached file", () => {
      test("Then the file manager should be triggered", async () => {
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage,
        });

        document.body.innerHTML = NewBillUI();

        const file = await screen.findByTestId("file");

        const handleChangeFile = jest.fn(newBill.handleChangeFile);

        file.addEventListener("change", handleChangeFile);

        fireEvent.change(file, {
          target: {
            files: [new File(["file"], "file.jpg", { type: "image/jpg" })],
          },
        });

        expect(handleChangeFile).toHaveBeenCalled();
      });

      // Test pour vérifier si le fichier avec le bon type est upload.
      test("Then the file with the correct type should be upload", async () => {
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage,
        });

        document.body.innerHTML = NewBillUI();

        const file = await screen.findByTestId("file");

        file.addEventListener("change", newBill.handleChangeFile);

        fireEvent.change(file, {
          target: {
            files: [new File(["file"], "file.jpg", { type: "image/jpg" })],
          },
        });

        expect(file.files.length).toEqual(1);

        expect(file.files[0].name).toBe("file.jpg");

        // Vérifier si le nom de fichier dans newBill correspond à "file.jpg".
        expect(newBill.fileName).toBe("file.jpg");
      });

      // Test pour vérifier si les fichiers avec un type différent de jpg, jpeg ou png doivent entraîner l'affichage d'un message d'erreur.
      test("Then files with a different type of jpg, jpeg or png should result in an error message", async () => {
        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage,
        });

        document.body.innerHTML = NewBillUI();
        const file = await screen.findByTestId("file");
        const consoleSpy = jest.spyOn(console, "log");
        file.addEventListener("change", newBill.handleChangeFile);
        fireEvent.change(file, {
          target: {
            files: [new File(["file"], "file.webp", { type: "image/webp" })],
          },
        });
        const errorMsg = document.querySelector("#errorMsg");

        expect(errorMsg).toHaveStyle({ display: "block" });
        expect(newBill.fileName).toBeNull();
        expect(consoleSpy).toHaveBeenCalledWith(
          "Mauvais format de fichier Format accepté: JPEG, JPG, PNG"
        );
      });

      test("Submitting a correct form should call handleSubmit method and redirect user on Bill page", async () => {
        const formNewBill = screen.getByTestId("form-new-bill");
        const inputExpenseType = screen.getByTestId("expense-type");
        const inputExpenseName = screen.getByTestId("expense-name");
        const inputDatepicker = screen.getByTestId("datepicker");
        const inputAmount = screen.getByTestId("amount");
        const inputVAT = screen.getByTestId("vat");
        const inputPCT = screen.getByTestId("pct");
        const inputCommentary = screen.getByTestId("commentary");
        const inputFile = screen.getByTestId("file");

        // Données à insérer
        const inputData = {
          type: "Transports",
          name: "Test",
          datepicker: "2023-04-24",
          amount: "1000",
          vat: "20",
          pct: "20",
          commentary: "Test Mocked Data",
          file: new File(["test"], "test.jpeg", { type: "image/jpeg" }),
        };

        // Insérer les données simulées
        fireEvent.change(inputExpenseType, {
          target: { value: inputData.type },
        });
        fireEvent.change(inputExpenseName, {
          target: { value: inputData.name },
        });
        fireEvent.change(inputDatepicker, {
          target: { value: inputData.datepicker },
        });
        fireEvent.change(inputAmount, { target: { value: inputData.amount } });
        fireEvent.change(inputVAT, { target: { value: inputData.vat } });
        fireEvent.change(inputPCT, { target: { value: inputData.pct } });
        fireEvent.change(inputCommentary, {
          target: { value: inputData.commentary },
        });
        userEvent.upload(inputFile, inputData.file);

        // Vérifier les valeurs insérées
        expect(inputExpenseType.value).toBe(inputData.type);
        expect(inputExpenseName.value).toBe(inputData.name);
        expect(inputDatepicker.value).toBe(inputData.datepicker);
        expect(inputAmount.value).toBe(inputData.amount);
        expect(inputVAT.value).toBe(inputData.vat);
        expect(inputPCT.value).toBe(inputData.pct);
        expect(inputCommentary.value).toBe(inputData.commentary);
        expect(inputFile.files[0]).toBe(inputData.file);

        // Navigation et soumission du formulaire
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };

        const newBill = new NewBill({
          document,
          onNavigate,
          store: mockStore,
          localStorage,
        });

        const handleSubmitSpy = jest.spyOn(newBill, "handleSubmit");

        formNewBill.addEventListener("submit", newBill.handleSubmit);
        fireEvent.submit(formNewBill);

        await waitFor(() => screen.getByText("Mes notes de frais"));
        expect(screen.getByText("Mes notes de frais")).toBeTruthy();
        expect(handleSubmitSpy).toHaveBeenCalled();
      });
    });
  });
});

describe("When I navigate to Dashboard employee", () => {
  describe("Given I am a user connected as Employee, and a user post a newBill", () => {
    test("Then add a bill from mock API POST", async () => {
      const postSpy = jest.spyOn(mockStore, "bills"); // Espionne l'appel de la méthode "bills" du mockStore

      // Création d'une facture fictive
      const bill = {
        id: "47qAXb6fIm2zOKkLzMro",
        vat: "80",
        fileUrl:
          "https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a",
        status: "pending",
        type: "Hôtel et logement",
        commentary: "séminaire billed",
        name: "encore",
        fileName: "preview-facture-free-201801-pdf-1.jpg",
        date: "2004-04-04",
        amount: 400,
        commentAdmin: "ok",
        email: "a@a",
        pct: 20,
      };

      const postBills = await mockStore.bills().update(bill); // Mise à jour de la facture via le mock

      expect(postSpy).toHaveBeenCalled(); // Vérifie que la méthode a été appelée
      expect(postBills).toStrictEqual(bill); // Vérifie que la facture renvoyée est identique à celle créée
    });
    describe("When an error occurs on the API", () => {
      // Configuration initiale pour tous les tests
      beforeEach(() => {
        window.localStorage.setItem(
          "user",
          JSON.stringify({ type: "Employee" })
        );
        document.body.innerHTML = NewBillUI();
      });

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };

      // Test pour l'erreur 404
      test("Then failed to add invoice and received API 404 error message", async () => {
        const postSpy = jest.spyOn(console, "error");
        const store = {
          bills: jest.fn(() => newBill.store),
          create: jest.fn(() => Promise.resolve({})),
          update: jest.fn(() => Promise.reject(new Error("404"))),
        };

        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage,
        });

        const form = screen.getByTestId("form-new-bill");
        form.addEventListener("submit", (e) => newBill.handleSubmit(e));

        fireEvent.submit(form);
        await new Promise(process.nextTick);
        expect(postSpy).toBeCalledWith(new Error("404"));
      });

      // Test pour l'erreur 500
      test("Then failed to add invoice and received API error 500", async () => {
        const postSpy = jest.spyOn(console, "error");
        const store = {
          bills: jest.fn(() => newBill.store),
          create: jest.fn(() => Promise.resolve({})),
          update: jest.fn(() => Promise.reject(new Error("500"))),
        };

        const newBill = new NewBill({
          document,
          onNavigate,
          store,
          localStorage,
        });

        const form = screen.getByTestId("form-new-bill");
        form.addEventListener("submit", (e) => newBill.handleSubmit(e));

        fireEvent.submit(form);
        await new Promise(process.nextTick);
        expect(postSpy).toBeCalledWith(new Error("500"));
      });
    });
  });
});
