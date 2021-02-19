const toggleForm = () => {
  const container = document.querySelector(".container2");
  container.classList.toggle("active");
};

function changeImg() {
  document.getElementById("sign_in_img").src =
    "https://i.pinimg.com/originals/0d/af/b7/0dafb7928a99a9cb552a941895a6e586.jpg";
  document.body.style.backgroundImage =
    "url('https://www.chrishazemusic.com/wp-content/uploads/2018/02/Website-Background-scaled.jpg')";
}

function changeImg2() {
  document.getElementById("sign_up_img").src =
    "https://www.chrishazemusic.com/wp-content/uploads/2018/02/Website-Background-scaled.jpg";
  document.body.style.backgroundImage =
    "url('https://i.pinimg.com/originals/0d/af/b7/0dafb7928a99a9cb552a941895a6e586.jpg')";
}
