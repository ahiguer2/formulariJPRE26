const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyqi0JopVzTniJ6waji85AA9Zpte0PQuLCxy3zx0mZszkT4_mmcmuSuhMEBpjH1iRjd/exec";

function buildId(franja, nom) {
  return `${franja.toLowerCase().replace(/\s+/g, "-")}-${nom
    .toLowerCase()
    .replace(/\s+/g, "-")}`;
}

const mockData = {
  franges: [
    {
      nom: "1a franja",
      tallers: Array.from({ length: 10 }, (_, i) => {
        const nom = `Taller ${i + 1}`;
        return {
          id: buildId("1a franja", nom),
          nom,
          placesTotals: 30,
          placesDisponibles: 30 - i * 2,
        };
      }),
    },
    {
      nom: "2a franja",
      tallers: Array.from({ length: 10 }, (_, i) => {
        const nom = `Taller ${i + 1}`;
        return {
          id: buildId("2a franja", nom),
          nom,
          placesTotals: 30,
          placesDisponibles: 28 - i * 2,
        };
      }),
    },
    {
      nom: "3a franja",
      tallers: Array.from({ length: 10 }, (_, i) => {
        const nom = `Taller ${i + 1}`;
        return {
          id: buildId("3a franja", nom),
          nom,
          placesTotals: 30,
          placesDisponibles: 26 - i * 2,
        };
      }),
    },
  ],
};

const state = {
  data: null,
  selected: {},
};

const container = document.getElementById("workshop-container");
const form = document.getElementById("registration-form");
const confirmButton = document.getElementById("confirm-button");
const message = document.getElementById("form-message");

function availabilityClass(available, total) {
  const ratio = total === 0 ? 0 : available / total;
  if (ratio >= 0.6) return "availability--high";
  if (ratio >= 0.25) return "availability--mid";
  return "availability--low";
}

function render() {
  container.innerHTML = "";
  state.data.franges.forEach((franja) => {
    const franjaEl = document.createElement("section");
    franjaEl.className = "franja";

    const title = document.createElement("h3");
    title.className = "franja__title";
    title.textContent = franja.nom;
    franjaEl.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "taller-grid";

    franja.tallers.forEach((taller) => {
      const card = document.createElement("div");
      card.className = "taller-card";
      card.dataset.franja = franja.nom;
      card.dataset.tallerId = taller.id;

      const selectedId = state.selected[franja.nom];
      if (selectedId === taller.id) {
        card.classList.add("selected");
      }

      const disabled =
        taller.placesDisponibles <= 0 ||
        (Object.keys(state.selected).length >= 2 && !state.selected[franja.nom]);
      if (disabled) {
        card.classList.add("disabled");
      }

      const name = document.createElement("div");
      name.className = "taller-name";
      name.textContent = taller.nom;

      const availability = document.createElement("div");
      availability.className = `availability ${availabilityClass(
        taller.placesDisponibles,
        taller.placesTotals
      )}`;
      availability.textContent = `Places disponibles: ${taller.placesDisponibles}`;

      card.appendChild(name);
      card.appendChild(availability);

      card.addEventListener("click", () => handleSelect(franja.nom, taller));

      grid.appendChild(card);
    });

    franjaEl.appendChild(grid);
    container.appendChild(franjaEl);
  });

  validateForm();
}

function handleSelect(franjaNom, taller) {
  if (taller.placesDisponibles <= 0) return;

  const alreadySelected = state.selected[franjaNom] === taller.id;
  if (alreadySelected) {
    delete state.selected[franjaNom];
  } else {
    const selectedCount = Object.keys(state.selected).length;
    if (selectedCount >= 2 && !state.selected[franjaNom]) {
      message.textContent = "Només pots seleccionar tallers de 2 franges.";
      return;
    }
    state.selected[franjaNom] = taller.id;
  }

  message.textContent = "";
  render();
}

function getSelections() {
  return Object.entries(state.selected).map(([franja, tallerId]) => {
    const taller = state.data.franges
      .find((f) => f.nom === franja)
      ?.tallers.find((t) => t.id === tallerId);

    return {
      franja,
      tallerId,
      tallerNom: taller ? taller.nom : "",
    };
  });
}

function validateForm() {
  const email = form.elements.email.value.trim();
  const emailOk = email.endsWith("@xtec.cat");
  const requiredFilled =
    form.elements.nom.value.trim() &&
    form.elements.centre.value.trim() &&
    form.elements.localitat.value.trim() &&
    emailOk;

  const selectionsOk = Object.keys(state.selected).length >= 1;

  if (email && !emailOk) {
    message.textContent = "El correu ha d’acabar en @xtec.cat.";
  }

  confirmButton.disabled = !(requiredFilled && selectionsOk);
}

function loadData() {
  if (WEB_APP_URL === "PENDENT_WEB_APP_URL") {
    state.data = mockData;
    message.textContent =
      "Mode prova: dades simulades. Actualitza l'URL del Web App per connectar amb Sheets.";
    render();
    return;
  }

  message.textContent = "Carregant places disponibles...";

  const callbackName = `loadDataCallback_${Date.now()}`;
  let timeoutId = null;

  window[callbackName] = (data) => {
    if (!data || !data.franges) {
      message.textContent =
        "Resposta no vàlida del servidor. Comprova el desplegament.";
      state.data = mockData;
      render();
    } else {
      state.data = data;
      message.textContent = "";
      render();
    }
    if (timeoutId) clearTimeout(timeoutId);
    delete window[callbackName];
    script.remove();
  };

  const script = document.createElement("script");
  const sep = WEB_APP_URL.includes("?") ? "&" : "?";
  script.src = `${WEB_APP_URL}${sep}callback=${callbackName}&_ts=${Date.now()}`;
  script.onerror = () => {
    message.textContent =
      "No s'han pogut carregar els tallers. Torna-ho a provar més tard.";
    state.data = mockData;
    render();
    if (timeoutId) clearTimeout(timeoutId);
    delete window[callbackName];
    script.remove();
  };

  timeoutId = setTimeout(() => {
    message.textContent =
      "El servidor no ha respost. Recarrega la pàgina o revisa el desplegament.";
    state.data = mockData;
    render();
    delete window[callbackName];
    script.remove();
  }, 5000);

  document.body.appendChild(script);
}

function postForm(payload) {
  const iframeName = "hidden-submit";
  let iframe = document.getElementById(iframeName);
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = iframeName;
    iframe.name = iframeName;
    iframe.style.display = "none";
    document.body.appendChild(iframe);
  }

  const tempForm = document.createElement("form");
  tempForm.method = "POST";
  tempForm.action = WEB_APP_URL;
  tempForm.target = iframeName;

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "payload";
  input.value = JSON.stringify(payload);

  tempForm.appendChild(input);
  document.body.appendChild(tempForm);
  tempForm.submit();
  tempForm.remove();
}

form.addEventListener("input", validateForm);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  message.textContent = "";

  if (confirmButton.disabled) {
    message.textContent = "Revisa les dades abans de confirmar.";
    return;
  }

  const payload = {
    nom: form.elements.nom.value.trim(),
    centre: form.elements.centre.value.trim(),
    localitat: form.elements.localitat.value.trim(),
    email: form.elements.email.value.trim(),
    seleccions: getSelections(),
  };

  try {
    confirmButton.disabled = true;
    postForm(payload);
    message.textContent =
      "Inscripció enviada. Si hi ha places, quedarà registrada en uns segons.";
    form.reset();
    state.selected = {};
    setTimeout(loadData, 1200);
  } catch (error) {
    message.textContent = "Error en enviar la inscripció. Torna-ho a provar.";
  } finally {
    validateForm();
  }
});

loadData();



