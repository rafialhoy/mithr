document.addEventListener("DOMContentLoaded", function() {
      // Show loading screen for 3 seconds
  setTimeout(function () {
    // Hide loading screen
    document.getElementById("loading-screen").style.display = "none";
    // Show dashboard content
    document.getElementById("feedback-content").style.display = "block";
  }, 3000); // 3000 milliseconds = 3 seconds
});

document.getElementById("invite-btn").addEventListener("click", function () {
    const userId = localStorage.getItem("userId"); // Assuming you store the user ID in local storage
    const baseUrl = "https://mithr.app/invite";
    const utmSource = "referral";
    const utmMedium = "user-invite";
    const utmCampaign = "invite-campaign";
    const utmContent = userId ? userId : "anonymous";
  
    const inviteUrl = `${baseUrl}?utm_source=${utmSource}&utm_medium=${utmMedium}&utm_campaign=${utmCampaign}&utm_content=${utmContent}`;
  
  
    // Optional: Automatically copy the invite link to the clipboard
    navigator.clipboard.writeText(inviteUrl).then(() => {
        alert('Invite link copied to clipboard!');
    });
  });