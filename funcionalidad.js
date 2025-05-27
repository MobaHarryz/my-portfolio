let menuVisible = false;
//Funcion que oculta o muestra el menu
function mostrarOcultarMenu() {
    if (menuVisible) {
        document.getElementById("nav").classList = "";
        menuVisible = false;
    } else {
        document.getElementById("nav").classList = "responsive"
        menuVisible = true;
    }
}

function seleccionar() {
    //oculta el menu una vez se selecciones alguna opción
    document.getElementById("nav").classList = "";
    menuVisible = false;
}

//Funcion para aplicar las animaciones de los skills
function efectoSkills() {
    var skills = document.getElementById("skills");
    var distancia_skills = window.innerHeight - skills.getBoundingClientRect().top;
    if (distancia_skills >= 300) {
        let habilidades = document.getElementsByClassName("progreso");
        habilidades[0].classList.add("disenouxui");
        habilidades[1].classList.add("javascript");
        habilidades[2].classList.add("htmlcss");
        habilidades[3].classList.add("database");
        habilidades[4].classList.add("qatesting");
        habilidades[5].classList.add("backend");
        habilidades[6].classList.add("cloud");
        habilidades[7].classList.add("adobexd");
        habilidades[8].classList.add("figma");
        habilidades[9].classList.add("psd");
        habilidades[10].classList.add("ai");
        habilidades[11].classList.add("trabajo");
        habilidades[12].classList.add("compromiso");
        habilidades[13].classList.add("comunic");
        habilidades[14].classList.add("dedicacion");
        habilidades[15].classList.add("proact");
        habilidades[16].classList.add("adapt");
    }
}
//detectar el scrollin para aplicar la animacion de la barra-skills
window.onscroll = function() {
    efectoSkills();
}


//Pop-Up de imagenes

/*document.querySelectorAll('.proyecto img').forEach(image => {
    image.onclick = () => {
        document.querySelector('.popup').style.display = 'block';
        document.querySelector('.popup img').src = image.getAttribute('src');
    }
});
document.querySelector('.popup span').onclick = () => {
    document.querySelector('.popup').style.display = 'none';
}*/

const gallery = document.querySelector(".gallery");
const popup = document.querySelector(".popup");
const popupImg = popup.querySelector("img");

gallery.addEventListener("click", function(event) {
    event.preventDefault();
    if (event.target.tagName === "IMG") {
        const imgSrc = event.target.parentElement.getAttribute("href");
        popupImg.setAttribute("src", imgSrc);
        popup.style.display = "block";
    }
});

popup.addEventListener("click", function(event) {
    if (event.target.tagName === "SPAN") {
        popup.style.display = "none";
    }
});