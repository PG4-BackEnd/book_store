const backdrop = document.querySelector(".backdrop");
const sideDrawer = document.querySelector(".mobile-nav");
const menuToggle = document.querySelector("#side-menu-toggle");

function backdropClickHandler() {
  backdrop.style.display = "none";
  sideDrawer.classList.remove("open");
}

function menuToggleClickHandler() {
  backdrop.style.display = "block";
  sideDrawer.classList.add("open");
}

backdrop.addEventListener("click", backdropClickHandler);
menuToggle.addEventListener("click", menuToggleClickHandler);

//http://localhost:4000/oauth/redirect?code=pJvygKOeGkYW9F69owZplRwBEyex2y_Ye0PqXRbyYl26I0G1qyUxrgAAAAQKPXPsAAABknS8nxcWphHJzwXJqw
//https://kauth.kakao.com/oauth/authorize?client_id==%20%22329ca7e85edc188c36d2f6d8458ad2a0%22&redirect_uri=http://localhost:4000/oauth/redirect&response_type=code
