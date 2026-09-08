
class InstrumentoMedicion {
  #id;
  #nombre;
  #calibrado;
  #ubicacion;

  constructor(id, nombre, ubicacion, calibrado) {
    this.#id = id;
    this.nombre = nombre;
    this.ubicacion = ubicacion;
    this.calibrado = calibrado;
  }

  get id() {
    return this.#id;
  }

  get nombre() {
    return this.#nombre;
  }
  set nombre(valor) {
    if (!valor || valor.trim().length < 2) {
      throw new Error("El nombre es obligatorio (mínimo 2 caracteres).");
    }
    this.#nombre = valor.trim();
  }

  get ubicacion() {
    return this.#ubicacion;
  }
  set ubicacion(valor) {
    if (!valor || valor.trim().length < 2) {
      throw new Error("La ubicación es obligatoria (mínimo 2 caracteres).");
    }
    this.#ubicacion = valor.trim();
  }

  get calibrado() {
    return this.#calibrado;
  }
  set calibrado(valor) {
    this.#calibrado = Boolean(valor);
  }

  obtenerDatos() {
    return "Instrumento genérico";
  }

  toJSON() {
    return {
      tipo: "base",
      id: this.#id,
      nombre: this.#nombre,
      ubicacion: this.#ubicacion,
      calibrado: this.#calibrado
    };
  }
}

class MultimetroDigital extends InstrumentoMedicion {
  #rangoMaximoVolts;
  #esAutoRango;

  constructor(id, nombre, ubicacion, calibrado, rangoMaximoVolts, esAutoRango) {
    super(id, nombre, ubicacion, calibrado);
    this.rangoMaximoVolts = rangoMaximoVolts;
    this.esAutoRango = esAutoRango;
  }

  get rangoMaximoVolts() {
    return this.#rangoMaximoVolts;
  }
  set rangoMaximoVolts(valor) {
    const numero = Number(valor);
    if (!numero || numero <= 0) {
      throw new Error("El rango máximo debe ser mayor a 0.");
    }
    this.#rangoMaximoVolts = numero;
  }

  get esAutoRango() {
    return this.#esAutoRango;
  }
  set esAutoRango(valor) {
    this.#esAutoRango = Boolean(valor);
  }

  obtenerDatos() {
    return this.rangoMaximoVolts + "V - " + (this.esAutoRango ? "auto-rango" : "rango manual");
  }

  toJSON() {
    const datos = super.toJSON();
    datos.tipo = "multimetro";
    datos.rangoMaximoVolts = this.#rangoMaximoVolts;
    datos.esAutoRango = this.#esAutoRango;
    return datos;
  }
}

class ColeccionInstrumentos {
  #lista = [];

  agregar(instrumento) {
    this.#lista.push(instrumento);
    this.guardar();
  }

  eliminar(id) {
    this.#lista = this.#lista.filter(function (inst) {
      return inst.id !== id;
    });
    this.guardar();
  }

  buscarPorId(id) {
    return this.#lista.find(function (inst) {
      return inst.id === id;
    });
  }

  cambiarCalibracion(id) {
    const instrumento = this.buscarPorId(id);
    if (instrumento) {
      instrumento.calibrado = !instrumento.calibrado;
      this.guardar();
    }
  }

  filtrarPorTexto(texto) {
    const t = texto.trim().toLowerCase();
    return this.#lista.filter(function (inst) {
      return inst.nombre.toLowerCase().includes(t) || inst.ubicacion.toLowerCase().includes(t);
    });
  }

  obtenerNombres() {
    return this.#lista.map(function (inst) {
      return inst.nombre;
    });
  }

  calcularPorcentajeRecalibracion() {
    const total = this.#lista.length;
    if (total === 0) return 0;
    const cantidadSinCalibrar = this.#lista.reduce(function (acumulado, inst) {
      return inst.calibrado ? acumulado : acumulado + 1;
    }, 0);
    return Math.round((cantidadSinCalibrar / total) * 100);
  }

  getLista() {
    return this.#lista;
  }

  guardar() {
    const listaPlana = this.#lista.map(function (inst) {
      return inst.toJSON();
    });
    localStorage.setItem("instrumentos", JSON.stringify(listaPlana));
  }

  cargar() {
    const datosGuardados = localStorage.getItem("instrumentos");
    if (!datosGuardados) return;

    const arreglo = JSON.parse(datosGuardados);
    this.#lista = arreglo.map(function (d) {
      if (d.tipo === "multimetro") {
        return new MultimetroDigital(d.id, d.nombre, d.ubicacion, d.calibrado, d.rangoMaximoVolts, d.esAutoRango);
      }
      return new InstrumentoMedicion(d.id, d.nombre, d.ubicacion, d.calibrado);
    });
  }
}

const coleccion = new ColeccionInstrumentos();
let siguienteId = 1;

const form = document.getElementById("form-instrumento");
const tipoSelect = document.getElementById("tipo");
const camposMultimetro = document.getElementById("campos-multimetro");
const buscador = document.getElementById("buscador");
const tabla = document.getElementById("tabla-instrumentos");
const resultado = document.getElementById("resultado");

tipoSelect.addEventListener("change", function () {
  camposMultimetro.style.display = tipoSelect.value === "multimetro" ? "block" : "none";
});

function mostrarTodo() {
  mostrarResultado();
  mostrarTabla(buscador.value);
}

function mostrarResultado() {
  const porcentaje = coleccion.calcularPorcentajeRecalibracion();
  resultado.textContent = "% que requieren recalibración: " + porcentaje + "%";
}

function mostrarTabla(textoFiltro) {
  const items = coleccion.filtrarPorTexto(textoFiltro || "");
  tabla.innerHTML = "";

  if (items.length === 0) {
    tabla.innerHTML = "<tr><td colspan='5'>No hay instrumentos.</td></tr>";
    return;
  }

  items.forEach(function (inst) {
    const fila = document.createElement("tr");
    const estadoClase = inst.calibrado ? "ok" : "bad";
    const estadoTexto = inst.calibrado ? "Calibrado" : "Requiere recalibración";

    fila.innerHTML =
      "<td>" + inst.nombre + "</td>" +
      "<td>" + inst.ubicacion + "</td>" +
      "<td>" + inst.obtenerDatos() + "</td>" +
      "<td class='" + estadoClase + "'>" + estadoTexto + "</td>" +
      "<td>" +
        "<button onclick='cambiarEstado(" + inst.id + ")'>Cambiar estado</button> " +
        "<button onclick='eliminarInstrumento(" + inst.id + ")'>Eliminar</button>" +
      "</td>";

    tabla.appendChild(fila);
  });
}

function cambiarEstado(id) {
  coleccion.cambiarCalibracion(id);
  mostrarTodo();
}

function eliminarInstrumento(id) {
  coleccion.eliminar(id);
  mostrarTodo();
}

buscador.addEventListener("input", function () {
  mostrarTabla(buscador.value);
});

form.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const nombreInput = document.getElementById("nombre");
  const ubicacionInput = document.getElementById("ubicacion");
  const rangoInput = document.getElementById("rango");

  nombreInput.classList.remove("invalid");
  ubicacionInput.classList.remove("invalid");
  rangoInput.classList.remove("invalid");
  document.getElementById("error-nombre").textContent = "";
  document.getElementById("error-ubicacion").textContent = "";
  document.getElementById("error-rango").textContent = "";

  let hayError = false;

  if (nombreInput.value.trim().length < 2) {
    nombreInput.classList.add("invalid");
    document.getElementById("error-nombre").textContent = "Ingresá un nombre válido.";
    hayError = true;
  }

  if (ubicacionInput.value.trim().length < 2) {
    ubicacionInput.classList.add("invalid");
    document.getElementById("error-ubicacion").textContent = "Ingresá una ubicación válida.";
    hayError = true;
  }

  if (tipoSelect.value === "multimetro" && (!rangoInput.value || Number(rangoInput.value) <= 0)) {
    rangoInput.classList.add("invalid");
    document.getElementById("error-rango").textContent = "Ingresá un rango mayor a 0.";
    hayError = true;
  }

  if (hayError) return;

  const calibrado = document.getElementById("calibrado").checked;
  const id = siguienteId;
  siguienteId++;

  let nuevoInstrumento;
  if (tipoSelect.value === "multimetro") {
    const rango = document.getElementById("rango").value;
    const autorango = document.getElementById("autorango").checked;
    nuevoInstrumento = new MultimetroDigital(id, nombreInput.value, ubicacionInput.value, calibrado, rango, autorango);
  } else {
    nuevoInstrumento = new InstrumentoMedicion(id, nombreInput.value, ubicacionInput.value, calibrado);
  }

  coleccion.agregar(nuevoInstrumento);
  mostrarTodo();
  form.reset();
  camposMultimetro.style.display = "none";
});

document.addEventListener("DOMContentLoaded", function () {
  coleccion.cargar();

  const lista = coleccion.getLista();
  if (lista.length > 0) {
    siguienteId = Math.max.apply(null, lista.map(function (i) { return i.id; })) + 1;
  }

  mostrarTodo();
});