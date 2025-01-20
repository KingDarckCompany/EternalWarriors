// Aquí puedes agregar interacciones, como sliders de imágenes, etc.
console.log("¡JavaScript funcionando!");

const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');

menuToggle.addEventListener('click', () => {
    mainNav.classList.toggle('active');
});

window.addEventListener('scroll', function() {
    let scrollPosition = window.pageYOffset;
    document.querySelector('.hero-background').style.transform = 'translateY(' + scrollPosition * 0.3 + 'px)';
});

            //personalización  cursor /////

// Crear el elemento del cursor personalizado
const cursor = document.createElement("div");
cursor.classList.add("custom-cursor");
document.body.appendChild(cursor);

// Actualizar la posición del cursor en tiempo real
document.addEventListener("mousemove", (e) => {
    cursor.style.left = `${e.pageX}px`;
    cursor.style.top = `${e.pageY}px`;
});

// Añadir clase "pulse" al pasar sobre enlaces o botones
document.querySelectorAll("a, button").forEach((el) => {
    el.addEventListener("mouseenter", () => {
        cursor.classList.add("pulse");
    });
    el.addEventListener("mouseleave", () => {
        cursor.classList.remove("pulse");
    });
});

// Cambiar al cursor de "click" mientras haces clic
document.addEventListener("mousedown", () => {
    cursor.classList.add("click");
});
document.addEventListener("mouseup", () => {
    cursor.classList.remove("click");
});

          /// fin de la zona del cursor ///