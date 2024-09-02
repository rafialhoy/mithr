document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("onboarding-form");
    const usernameInput = document.getElementById("username");
    const continueLink = document.getElementById("continue-link");
  
    // Array of placeholder options
    const placeholders = [
      "By what name are you known in the Shire?",
      "State your name to the King of Gondor...",
      "What do they call you, wise one?"
    ];
  
    // Initialize the onboarding page
    function initializeOnboarding() {
      setRandomPlaceholder();
      handleInputChange();
      handleFormSubmit();
      handleContinueClick();
    }
  
    // Randomly set a placeholder for the username input
    function setRandomPlaceholder() {
      const randomPlaceholder = placeholders[Math.floor(Math.random() * placeholders.length)];
      usernameInput.setAttribute("placeholder", randomPlaceholder);
    }
  
    // Handle input changes and toggle CTA visibility
    function handleInputChange() {
      usernameInput.addEventListener("input", function() {
        if (usernameInput.value.trim() !== "") {
          continueLink.classList.remove("disabled-link");
          continueLink.classList.add("visible-link");
        } else {
          continueLink.classList.remove("visible-link");
          continueLink.classList.add("disabled-link");
        }
      });
    }
  
    // Handle form submission
    function handleFormSubmit() {
      form.addEventListener("submit", function(event) {
        event.preventDefault();
        const username = capitalizeFirstLetter(usernameInput.value.trim());
        if (username) {
          localStorage.setItem("mithrUsername", username);
          window.location.href = "dashboard.html";
        }
      });
    }
  
    // Handle the continue link click
    function handleContinueClick() {
      continueLink.addEventListener("click", function(event) {
        if (!continueLink.classList.contains("visible-link")) {
          event.preventDefault();
        } else {
          const username = capitalizeFirstLetter(usernameInput.value.trim());
          if (username) {
            localStorage.setItem("mithrUsername", username);
            window.location.href = "dashboard.html";
          }
        }
      });
    }
  
    // Capitalize the first letter of the username
    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }
  
    // Initialize the onboarding logic
    initializeOnboarding();
  });