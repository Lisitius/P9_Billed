import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const formNewBill = this.document.querySelector(
      `form[data-testid="form-new-bill"]`
    );
    formNewBill.addEventListener("submit", this.handleSubmit);
    const file = this.document.querySelector(`input[data-testid="file"]`);
    file.addEventListener("change", this.handleChangeFile);
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({ document, localStorage, onNavigate });
  }
  // Fonction ajoutée pour vérifier la validité du format du fichier
  isFileFormatValid = (fileName) => {
    const extension = fileName.match(/\.([a-z]+)$/i)[1];
    return /(jpe?g|png)$/i.test(extension);
  };

  handleChangeFile = (e) => {
    e.preventDefault();

    const fileInput = this.document.querySelector(`input[data-testid="file"]`);
    const file = fileInput.files[0];
    const fileName = file.name;

    // Gestion des erreurs concernant le format du fichier ajoutée
    const errorMsg = document.querySelector("#errorMsg");
    errorMsg.style.display = "none";

    if (!this.isFileFormatValid(fileName)) {
      console.log("Mauvais format de fichier. Format accepté: JPEG, JPG, PNG");
      fileInput.value = "";
      errorMsg.style.display = "block";
      return;
    }

    this.fileName = fileName;
    this.file = file;
  };

  // Fonction ajoutée pour séparer la création de la facture de la soumission du formulaire
  async createBillInDB(formData) {
    try {
      const response = await this.store.bills().create({
        data: formData,
        headers: {
          noContentType: true,
        },
      });

      this.billId = response.key;
      this.fileUrl = response.fileUrl;
    } catch (error) {
      console.error(error);
    }
  }

  handleSubmit = async (e) => {
    e.preventDefault();

    const email = JSON.parse(localStorage.getItem("user")).email;

    const formData = new FormData();
    formData.append("file", this.file);
    formData.append("email", email);

    // Utilisation de l'asynchronicité pour améliorer la gestion des opérations
    await this.createBillInDB(formData);

    const bill = {
      email,
      type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
      name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
      amount: parseInt(
        e.target.querySelector(`input[data-testid="amount"]`).value
      ),
      date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
      vat: e.target.querySelector(`input[data-testid="vat"]`).value,
      pct:
        parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) ||
        20,
      commentary: e.target.querySelector(`textarea[data-testid="commentary"]`)
        .value,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: "pending",
    };

    this.updateBill(bill);
    this.onNavigate(ROUTES_PATH["Bills"]);
  };

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH["Bills"]);
        })
        .catch((error) => console.error(error));
    }
  };
}
