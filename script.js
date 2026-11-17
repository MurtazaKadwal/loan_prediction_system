// Update this URL if your FastAPI backend is hosted somewhere else.
const API_BASE = "http://127.0.0.1:8000";

const form = document.getElementById("loanForm");
const submitBtn = document.getElementById("submitBtn");
const formError = document.getElementById("formError");
const overlay = document.getElementById("resultOverlay");
const resultCard = document.querySelector(".result-card");

function showResult(data) {
  const approved = data.loan_status === "Approved";
  const probability = Number(data.approval_probability);

  resultCard.classList.toggle("rejected", !approved);
  document.getElementById("resultSymbol").textContent = approved ? "✳" : "↗";
  document.getElementById("resultTitle").textContent =
    approved ? "A positive signal." : "There may be work to do.";
  document.getElementById("resultDescription").textContent =
    approved
      ? "Based on the details provided, the model estimates that your application may be eligible for approval."
      : "Based on the details provided, the model estimates a lower likelihood of approval. You may wish to review your financial profile.";
  document.getElementById("probabilityValue").textContent =
    `${probability.toFixed(2)}%`;
  document.getElementById("progressFill").style.width =
    `${Math.min(100, Math.max(0, probability))}%`;

  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden", "false");
  document.getElementById("closeResult").focus();
}

function closeResult() {
  overlay.classList.remove("show");
  overlay.setAttribute("aria-hidden", "true");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formError.textContent = "";

  if (!form.reportValidity()) return;

  const formData = new FormData(form);
  const payload = {
    ApplicantIncome: Number(formData.get("ApplicantIncome")),
    CoapplicantIncome: Number(formData.get("CoapplicantIncome")),
    LoanAmount: Number(formData.get("LoanAmount")),
    Loan_Amount_Term: Number(formData.get("Loan_Amount_Term")),
    Dependents: Number(formData.get("Dependents")),
    Gender: formData.get("Gender"),
    Married: formData.get("Married"),
    Education: formData.get("Education"),
    Self_Employed: formData.get("Self_Employed"),
    Credit_History: Number(formData.get("Credit_History")),
    Property_Area: formData.get("Property_Area")
  };

  submitBtn.disabled = true;
  submitBtn.querySelector(".button-label").textContent = "Analysing your details…";

  try {
    const response = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      const detail = typeof data.detail === "string"
        ? data.detail
        : "Please check the information and try again.";
      throw new Error(detail);
    }

    if (typeof data.approval_probability !== "number" ||
        !["Approved", "Rejected"].includes(data.loan_status)) {
      throw new Error("The API returned an unexpected response format.");
    }

    showResult(data);
  } catch (error) {
    if (error instanceof TypeError) {
      formError.textContent =
        "Could not connect to the API. Start FastAPI and check the API_BASE URL.";
    } else {
      formError.textContent = error.message;
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.querySelector(".button-label").textContent = "Check my eligibility";
  }
});

document.getElementById("closeResult").addEventListener("click", closeResult);
document.getElementById("tryAgain").addEventListener("click", closeResult);
overlay.addEventListener("click", (event) => {
  if (event.target === overlay) closeResult();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeResult();
});
