document.getElementById("cta-btn").addEventListener("click", function(event) {
    event.preventDefault(); // Prevent the default link behavior

    // Check if the user's name is stored in localStorage
    const username = localStorage.getItem("mithrUsername");

    // Redirect based on onboarding status
    if (username) {
      window.location.href = "dashboard.html";
    } else {
      window.location.href = "onboarding.html";
    }
  });