document.addEventListener("DOMContentLoaded", function () {
  // Show loading screen for 3 seconds
  setTimeout(function () {
    // Hide loading screen
    document.getElementById("loading-screen").style.display = "none";
    // Show dashboard content
    document.getElementById("dashboard-content").style.display = "block";
    
    // Call the updateLastExportDisplay to ensure it's shown after loading
    updateLastExportDisplay();
  }, 3000); // 3000 milliseconds = 3 seconds

  // Declare all modal elements and buttons at the start
  const viewModal = document.getElementById("viewExperimentModal");
  const editModal = document.getElementById("editExperimentModal");
  const exportModal = document.getElementById("exportReportModal");

  const closeViewModalBtn = document.getElementById("close-view-modal");
  const closeEditModalBtn = document.getElementById("close-edit-modal");
  const closeExportModalBtn = document.getElementById("close-export-modal");
  const closeViewBtn = document.getElementById("close-view");
  const closeEditBtn = document.getElementById("close-edit");
  const cancelExportBtn = document.getElementById("cancel-export");
  const exportBtn = document.getElementById("export");

  const editExperimentForm = document.getElementById("editExperimentForm");
  const deleteExperimentBtn = document.getElementById("delete-experiment");
  const confirmExportBtn = document.getElementById("confirm-export");
  const budget =
    parseFloat(document.getElementById("budget").value.replace(/,/g, "")) || 0;
  const actualSpend =
    parseFloat(
      document.getElementById("actual-spend").value.replace(/,/g, "")
    ) || 0;
  const categoryFilterElement = document.getElementById("category-filter");
  const kpiFilterElement = document.getElementById("kpi-filter");
  const statusFilterElement = document.getElementById("status-filter");

  // Event Listeners for Modal Buttons
  if (closeViewModalBtn)
    closeViewModalBtn.addEventListener(
      "click",
      () => (viewModal.style.display = "none")
    );

  if (categoryFilterElement) {
    categoryFilterElement.addEventListener("change", () => filterExperiments());
  }

  if (kpiFilterElement) {
    kpiFilterElement.addEventListener("change", () => filterExperiments());
  }

  if (statusFilterElement) {
    statusFilterElement.addEventListener("change", () => filterExperiments());
  }

  if (closeEditModalBtn)
    closeEditModalBtn.addEventListener(
      "click",
      () => (editModal.style.display = "none")
    );
  if (closeExportModalBtn)
    closeExportModalBtn.addEventListener(
      "click",
      () => (exportModal.style.display = "none")
    );
  if (closeViewBtn)
    closeViewBtn.addEventListener(
      "click",
      () => (viewModal.style.display = "none")
    );
  if (closeEditBtn)
    closeEditBtn.addEventListener(
      "click",
      () => (editModal.style.display = "none")
    );
  if (cancelExportBtn)
    cancelExportBtn.addEventListener(
      "click",
      () => (exportModal.style.display = "none")
    );
  if (exportBtn)
    exportBtn.addEventListener("click", () => {
      exportModal.style.display = "block";

      const experiments = JSON.parse(localStorage.getItem("experiments")) || [];
      populateCategoryKPIAndStatusDropdownsForExportModal(experiments);
    });

  // Ensure modals close when clicking outside the modal
  window.addEventListener("click", (event) => {
    if (event.target === viewModal) viewModal.style.display = "none";
    if (event.target === editModal) editModal.style.display = "none";
    if (event.target === exportModal) exportModal.style.display = "none";
  });

  let sortOrder = {
    date: "asc",
    projectedOutcome: "asc",
    actualOutcome: "asc",
    budget: "asc",
    actualSpend: "asc",
    potential: "asc",
    status: "asc",
  };

  // Sorting map for potential
  const potentialRanking = {
    High: 1,
    Medium: 2,
    Low: 3,
    "N/A": 4,
  };
  // Event listeners for sorting buttons
  document
    .getElementById("sort-date")
    .addEventListener("click", () => sortTable("startDate", "sort-date"));
  document
    .getElementById("sort-budget")
    .addEventListener("click", () => sortTable("budget", "sort-budget"));
  document
    .getElementById("sort-actual-spend")
    .addEventListener("click", () =>
      sortTable("actualSpend", "sort-actual-spend")
    );
  document
    .getElementById("sort-potential")
    .addEventListener("click", () => sortTable("potential", "sort-potential"));
  document
    .getElementById("sort-status")
    .addEventListener("click", () => sortTable("status", "sort-status"));

  // Sorting logic
  function sortTable(column, buttonId) {
    let experiments = JSON.parse(localStorage.getItem("experiments")) || [];
    let experimentsForTable = [...experiments]; // Clone the array for sorting

    // Determine sorting order
    let currentOrder = sortOrder[column];
    let newOrder = currentOrder === "asc" ? "desc" : "asc";
    sortOrder[column] = newOrder;

    // Sorting logic
    experimentsForTable.sort((a, b) => {
      let comparison = 0;

      switch (column) {
        case "startDate":
          comparison = new Date(a.startDate) - new Date(b.startDate);
          break;
        case "budget":
          comparison =
            parseFloat(a.budget.toString().replace(/,/g, "")) -
            parseFloat(b.budget.toString().replace(/,/g, ""));
          break;
        case "actualSpend":
          comparison =
            parseFloat(a.actualSpend.toString().replace(/,/g, "")) -
            parseFloat(b.actualSpend.toString().replace(/,/g, ""));
          break;
        case "potential":
          comparison =
            potentialRanking[determinePotential(a)] -
            potentialRanking[determinePotential(b)];
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return newOrder === "asc" ? comparison : -comparison;
    });

    // Update the table with sorted data
    updateFilteredTable(experimentsForTable);
    updateSortingIcons(buttonId, newOrder);

    // No need to update analytics and top experiments when sorting
  }

  function updateSortingIcons(activeButtonId, direction) {
    // Reset all sort buttons
    document.querySelectorAll(".sort-btn .arrow").forEach((arrow) => {
      arrow.textContent = "▲▼"; // Reset to default state
    });

    // Set active button arrow direction
    const activeButton = document.querySelector(`#${activeButtonId} .arrow`);
    if (direction === "asc") {
      activeButton.textContent = "▲";
    } else {
      activeButton.textContent = "▼";
    }
  }

  // Function to handle row clicks and open the View Experiment modal
  function addRowClickEvents() {
    const tableRows = document.querySelectorAll("#experiments-table-body tr");
    tableRows.forEach((row) => {
      row.addEventListener("click", () => {
        const experimentId = parseInt(row.getAttribute("data-experiment-id"));
        if (deleteExperimentBtn)
          deleteExperimentBtn.setAttribute("data-experiment-id", experimentId);
        openViewModal(experimentId);
      });
    });
  }

  // Open the Add Experiment modal when the "Add Experiment" button is clicked
  const addExperimentBtn = document.getElementById("add-experiment");
  const addExperimentModal = document.getElementById("addExperimentModal");

  if (addExperimentBtn && addExperimentModal) {
    addExperimentBtn.addEventListener("click", () => {
      addExperimentModal.style.display = "block";
    });
  }
  // Add Experiment Modal close functionality
  const closeAddModalBtn = document.getElementById("close-modal"); // The X button
  const cancelAddModalBtn = document.querySelector(".cancel-btn"); // The cancel button

  if (closeAddModalBtn && addExperimentModal) {
    closeAddModalBtn.addEventListener("click", () => {
      addExperimentModal.style.display = "none";
    });
  }

  if (cancelAddModalBtn && addExperimentModal) {
    cancelAddModalBtn.addEventListener("click", () => {
      addExperimentModal.style.display = "none";
    });
  }

  function exportToPDF(filteredExperiments) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add your base64 logo image at the top (Placeholder)
    const imgData =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASoAAABUCAYAAAA1ZXoqAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAA2JSURBVHgB7d1fjFxVGQDw79zZhgI7M3e7m66wCFMRiUEBoxgjIU5RfNAQMAZfjKG8qlgqNBIQuiB/BMW2+mhMl8R3W0FiW+kODyYmgl0fjKiJTGJr0rh/7p3p+qfde4/fOfcuTHd37rl35pwz9858v2S6szt3unfnzzff+c4/AEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIIYQQQgghhBBCCCGEEEIIISTHGBBSYC6CMNyLr+Q9ALyGP/LwsgCstM/zvAUgQ4ECFSksjFE14OF8HKA242zWa7WeAlJ4lwSqqamp8oULF24HS8bGxv60vLz8DxhCV1xxxVX4993iOM7b+MnehD65buUgcH6r8kAOTa/VfgByxK1UDgDjdeWBnC1gYNkHKbnVyjtdg9Q6xnd73vkG5JTMCHnwi8SDWOkBHa+hIhvr/GZxcfHf1Wrlbgb862BBGFw4MzlZvmtpqf02DJFqtbqLQXgU30Q3AwQP449+BP2KglRdeRyTL37R7PEgB6KsJ5hNdbDDIS38f+v4/9aUB3J2AP9tQH65kOZ5HXHOhu8D3299A18uPwQr2DXBGj9ZqVQ+CEMC/5YdGKRO4NWbYWDChyA3wj1gRFhPeaA6CyW552z1Q99vP4op8yGwgl3jsLAxOTn+YSg4kUk5jGPNBAYbeDnfK5sUecDhfjAjFxkjsWOsy88DbNfvm6iWL2J2tR+MYzPBGsxjNnJHq9X6GxRQuVyexEzqJF69HgZvvTlxFAbIdct7MGjWwIhwIVVfEIPMPX9UN8qfsaQbVzCzwiLu5fhi+yaYN42Z1SnMrD6/tHT+z1AgExMT1/Jw7TeQjyAV4cFeGHCgMphNgSiQu9VyA5T1nTB1cb4D1Y1yxlHcHnpe60HMqp4DK0TNijUws7oBCkJkUhikTuHVvJ1z3XXH6zAgsohu+s2OWQ3+0+x+e4idCqs0lmoIqAKVhDWrJ4Cxn4AdOzGzmscsZYDF6HREJlVy4E3IUyZ1CedeGJjgABgmml6e39qFzbsH8NLA12gzvhzGIPUxDFKW6qzEtLGUx4nM6iG3UhHjUh4E49gMDy++hpnV7rzWrDBjuA4zqVfwag3yivP78TxnBzJUgbO6aPvZ4HntOfwyB2RopcqoYqHXan0LP62+B1awGZFZ4RvtFsgZEaSwBtTAqx+FfHPNDQ9I+KWiiA6miuhkFGUJVBJmVrP4QXkQrGAzEK69tmPH+E2QE9Vq9XoMUq9CnjOpTpzfA7YZLKKT0ZQ5UIHMrNrf5qGlAjtjV4cBO4VF6w/BgOE5TMWDOT8CxWG1qO66V6YbQU9IBr0EKslviwK7rUGhsLPEOBbYxwcWIEQmhYXz1/HqB6BwbBbVnb1AiGY9ByqQBfbz+zBY2alZYWbFQzY/iMyqI5PKfU/klqKiuvGR6tG8PhhgTyMRxPMQX/IxO0HBjdQ6LxuPSdvr1xUGq1nsDaxgwLLxSTolMivMbu72ff8PYEFcOH8Dr14HxeXG8/9mwaigHv0uO6JmZikpMGJ/Z+tQ9vuHKf6G8CHXrXi9/m5d5ORsCO+JJ62LixhV/97t1TL+yxbw9gVwSsfwpLQNAo4CYeK80q6PgTzvMLgfGH6w8WDT4+1WynOdq4D0Hagg6g3ch8GqhcHqCTANMyvGg1fwD73d9BQGkUnFhfMiBCnxpun+BuMgiuqzYJJcqcDOkISIcyu+AZPGazXxcqiP+3fHlR/MzeTf3Z949YgDeKmrj8YgxjCI8WAPBq4mPk9z4DiHNQxbcbM+/tF5h0fkyhcZVsPrp+nXiWOwehIfgKfBBgxW2Bv4W8ysPg6GiEyqVGJvQVEK5wz2JY7SxheryaJ69MmeOCShKQdmkr5hUnAQ3+hi8nsdssMAwbHnPjgdd3xYI9clk+edfeiKrkAlYbDCB4D1v/ZSGlFm9cuJiSu1j2WSy86ITIrza6FIGLyceHu0NpMhQfKQBDFanPQNM6J5DDQ6lvHBeqJz2i2XrQwliRdPnIUeaQ1UEGVWD+Mb4hmwQRbYHd0F9jGHwXEo1hCEmCPS7KR0vm6iwBoX0fckH+UMdoL0EJCZlO6hHw7MuW7ZaAeIHADcR5ASdAcqSTYDrY1gh8mSA8cxs9LSI4dBD9/IvIBDEGTl0sOs6ljyUSYW1VPUSTjM0ZIo/Ynf7AaeOxDPz5Gtetr0/f/9Z/JGAhWIzMqTNStbwaoWZ1Y3wsjjc8k3G+idVb0QHZ7cJCVqRpvtsqfQyGwTXdOpdPT6dYWZ1QFMV8fxk6CXNYGy2iGGLmB96Z5Wq/V7GFEp1mlyRVFd14YHstmQvDheM7+bK5SOylUXNlnDpiybT7wr47vx7dMEG3hwBLaasiXPnWEGLeadbuto8uP5yx5N2JshSNyr83URcxOn20Xn/0eIyhXrvdaiRXMLtsj8zkONBiqIa1ZuZXzZSlOQsascHh7DzOrOdnu4NozIhOGLlyfs+qJ3wwNFER1yu11V3D2/qaYXlfECxb3Hmhabs/VLvpNv8MQVRsXP8Rg4FK2yKoeN1EBJzmBogD5b1UOxPMGxY2XsUJbhEaaafp0wWJ1/Bh8sOxOZRbCKMqtPwshy5sBCUT3dSPRSA4g+jD/lee3daYOkXAKHObuTh67EODfbAyjXDCvtEoPEs47hshGoJJFZcXCs7G7DGHsfg/CY616ZuyVibIiK6kxRF9JRVFcsjkdFdL1kkDo/CxnJ54CFacawucbG2jF4OQ6wPQ0ytRaoEPd9f7/YvRYsEMEKeOkHMLLC5OEAOnaqkYvjJaAiuk7NXoLUOll7Uo2zkxwTg0Dx3Nt7oA82A5WEmdXTHOAFsIAxuBxGVFwUbSQcgkEq6Hn8TIrenBwX0QuIcQ2j+hU9wpEa6Kbh3K0HKpCZVftRw92tRBBF9ST9LHDHi1tELyAtQT/KqlS1Ks0rs2JdSse5DyJQSZhZYS+g8xIQg9IU1bPXJFLsMOPJrn+ih+oDJ5s3FLdXQSs95z6wQAWiN9D3H2EAjwExIi6qK+bY9bKonrKIfnQgG0oMLacB+lh+XsRGsf0bZKCSVvz29ymzMilQFdWzL6qnLKKXqNmn1ZrO4GI5UOkZFDvwQAVxZmWrwD5q4g04GwmHZNqpRllElzUJGpJA9MpDoJKiAruFhfdGEePJGU6WnWo4U80VpCEJRLvcBCpBjGDHzOp5IFrFvS59F9WjhdZ40jibZrwZKCFa5SpQCZhZPUaZlQGqonrIUgxVUOwww7XOEyPkXbkLVILIrLA30Mp0m9HhJK/fzcTs+e5F9VSL41ERnRiSy0AlYG/gfgbho0C0iIcLNBIOUewoolgcj4roxKBMgaper49d5brXVavVOyuVyhfE5gq1Wm07GLLir75AmZVG6qJ69+afeiYBFdGJMakCldgleGKi+uLC6bfO/ocHTcx0XncY/xV+fdNfWVpxq+MnJiYqX7zvvvtKoFmUWfHvAulbiqJ6bauiepodZqiITkxSBSrmupUHRUDiYbgfv9+58QDspcOMit3FQ/7qyRPHfz01NXU1aLbin38WM6vHgfRPVVTfMnNS7jBD2RQxqmugmp0FZ4db/hk2B34MqXe/5Z9bu/jf35lYKB4zq+cwKD4HpE+KovqGRfVS7jAzB4QY1DVQHT5YfjjkvWwYyd4PPDgxMzMzCZr5fvtxyqz6E+9Uo5gw3FlUpx1myOBtGagmJsp3YPbyLPTuhtVV38iGkyKzUhaFiQJXNP86dqqhHWZIDmwZqHgIs/hlG/SDs69iEd7I/nhipUNadaF3UVGdJc1ql0vSRhtT0uJ4ZPA2Bao4uNwJWoRfBkMws3oeg9WLQHqj3v79iHJDDlocj1iyKVA5Dv80aMKAfQUMwmD1HWDhI0B6oFxUr6Ze7ZF2mCF2bApUPAg/AfpM40X72KpOnrf6EqfMKrN0O9UkoCK6iU0QSBebAhUrMY0bIvDt09PTxkaur/NlZmVt+/ghEva+XPDIF9HDOhBrtiimsxC0Yavnzp37H1jgea0nqcCeTYqdaroZ6iJ6nCkmr4QZrYxaA2KF0UnJDuN/xy9rYIkosFNmlVEvGweMRhFdtda3i3WS+WjF0w03aNiFmlzKaKAKOD8FllFmlZWyqL6RNxJFdMZUu7UIYtT+Ebda5m618s76BQPYirEdh0eUyUAVbtu2/QgMgMisaA32dDIX1aMdZpow9ORUowwBXPSQrl/k/etAtDEXqDgcWlxc/CcMiFiD3aFNTlPKUFR3SkZmHORNFMDD3pu4nH8GiDZGAhVmM38dr7B+puBoseT71pueRZS6qB4tjqdln7Yi8LxVkVU1oDc0fEEj7YEK60N/KZW2ffbMmdYykOJgkCZTGr0hCaz0JegtWLnUK6iPzkAVYCr1c85Kn1peXj4DpGBkgTypJjOSi+OJJqDnt3f3NhFesfIESU1HoFrGLOqnwILbvFb7a7SVdzG9W5NhrLn1hWcfxjBExER4zK52RXMk8fFIcRex7iQQLdjGH0xPj+9cW2M7VHe8eJEFl10WtG+66bbFRqNhbayUBWxysnwjaLJ9e+VfZ8+eXQIyVKI9Dp0avlw21KJ4M7qMLdCHNiGEEEIIIYQQQgghhBBCCCGEEEJIYfwfnK8188hocZcAAAAASUVORK5CYII=";
    if (imgData) {
      doc.addImage(imgData, "PNG", 10, 10, 50, 15); // Adjust position and size as needed
    }

    // Title
    doc.setFontSize(14);
    doc.text("Data Export", pageWidth / 2, 20, { align: "center" });

    // Fetch filters (used for subtitle)
    const dateRange = document.getElementById("export-date-range").value;
    const categoryFilter =
      document.getElementById("export-category-filter").value ||
      "All Categories";
    const kpiFilter =
      document.getElementById("export-kpi-filter").value || "All KPIs";
    const statusFilter =
      document.getElementById("export-status-filter").value || "All Statuses";

    // Subtitle with filters
    doc.setFontSize(11);
    doc.text(`Category: ${categoryFilter}`, 10, 35);
    doc.text(`KPI: ${kpiFilter}`, pageWidth / 2, 35, { align: "center" });
    doc.text(`Status: ${statusFilter}`, pageWidth - 10, 35, { align: "right" });
    if (dateRange) {
      doc.text(`Date Range: ${dateRange}`, 10, 45);
    }

    // Table content
    const tableColumn = [
      "Name",
      "Category",
      "KPI",
      "Projected Outcome",
      "Actual Outcome",
      "Budget",
      "Actual Spend",
      "Potential",
    ];
    const tableRows = [];

    filteredExperiments.forEach((experiment) => {
      const experimentData = [
        experiment.experimentName,
        experiment.category,
        experiment.kpi,
        experiment.projectedOutcomeType +
          " " +
          experiment.projectedOutcomeValue +
          experiment.projectedOutcomeUnit,
        experiment.actualOutcome || "N/A",
        `$${experiment.budget} USD`,
        `$${experiment.actualSpend} USD`,
        determinePotential(experiment),
      ];
      tableRows.push(experimentData);
    });

    // Custom styles for table
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: dateRange ? 55 : 45, // Adjust startY based on the presence of dateRange
      theme: "grid",
      headStyles: { fillColor: "#000" }, // Sidebar background color
      styles: { fontSize: 10, cellPadding: 3 }, // Smaller font size
    });

    // Footer
    doc.setFontSize(10);
    doc.text(
      "Track, analyze, and share your campaigns at www.mithr.app",
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );

    // Save the PDF
    doc.save("Mithr-Data-Export.pdf");
  }

  function exportToExcel(filteredExperiments) {
    const worksheet = XLSX.utils.json_to_sheet(filteredExperiments);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Experiments");

    // Export to Excel file
    XLSX.writeFile(workbook, "Experiment_Data_Export.xlsx");
  }

  if (confirmExportBtn) {
    confirmExportBtn.removeEventListener("click", handleExportClick); 
    confirmExportBtn.addEventListener("click", handleExportClick);
}

function handleExportClick() {
    const fileType = document.getElementById("export-file-type").value;
    const dateRange = document.getElementById("export-date-range").value;
    const categoryFilter = document.getElementById("export-category-filter").value;
    const kpiFilter = document.getElementById("export-kpi-filter").value;
    const statusFilter = document.getElementById("export-status-filter").value;

    let experiments = JSON.parse(localStorage.getItem("experiments")) || [];

    // Apply filters to the experiments for export
    if (dateRange) {
        const [startDate, endDate] = dateRange.split(" - ");
        experiments = experiments.filter((experiment) => {
            const experimentStart = new Date(experiment.startDate);
            const experimentEnd = new Date(experiment.endDate);
            return (
                experimentStart >= new Date(startDate) &&
                experimentEnd <= new Date(endDate)
            );
        });
    }
    if (categoryFilter) {
        experiments = experiments.filter((experiment) => experiment.category === categoryFilter);
    }
    if (kpiFilter) {
        experiments = experiments.filter((experiment) => experiment.kpi === kpiFilter);
    }
    if (statusFilter) {
        experiments = experiments.filter((experiment) => experiment.status === statusFilter);
    }

    // Export logic based on file type
    if (fileType === "pdf") {
        exportToPDF(experiments);
    } else if (fileType === "excel") {
        exportToExcel(experiments);
    }

    updateLastExportTime(); // Save the new export timestamp
    updateLastExportDisplay(); // Update the display immediately
    document.getElementById("exportReportModal").style.display = "none";
}

function updateLastExportTime() {
    const now = new Date().toISOString();
    localStorage.setItem("lastExportTimestamp", now);
    updateLastExportDisplay();
}

function updateLastExportDisplay() {
    const lastExportElement = document.getElementById("last-export-info");
    const storedTimestamp = localStorage.getItem("lastExportTimestamp");
  
    if (storedTimestamp) {
      const lastExportText = document.createElement("span");
      lastExportText.classList.add("color-secondary-grey");
      lastExportText.textContent = "Last Export: ";
  
      const lastExportTimeElement = document.createElement("span");
      lastExportTimeElement.textContent = getLastExportFormattedTime();
  
      lastExportElement.innerHTML = "";
      lastExportElement.appendChild(lastExportText);
      lastExportElement.appendChild(lastExportTimeElement);
    } else {
      lastExportElement.innerHTML = "No export yet"; // Default message if no export has happened
    }
  }

function getLastExportFormattedTime() {
    const storedTimestamp = localStorage.getItem("lastExportTimestamp");
    if (storedTimestamp) {
        const lastExportDate = new Date(storedTimestamp);
        const options = {
            weekday: "long",
            hour: "numeric",
            minute: "numeric",
            hour12: true,
            timeZoneName: "short",
        };

        // Formatting logic to handle "Today", "Yesterday", etc.
        const now = new Date();
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);

        if (now.toDateString() === lastExportDate.toDateString()) {
            return `Today, ${lastExportDate.toLocaleTimeString("en-US", options)}`;
        } else if (yesterday.toDateString() === lastExportDate.toDateString()) {
            return `Yesterday, ${lastExportDate.toLocaleTimeString("en-US", options)}`;
        } else {
            return lastExportDate.toLocaleString("en-US", options);
        }
    } else {
        return "No export yet";
    }
}




  // Close the modal when clicking outside of the modal content
  window.addEventListener("click", (event) => {
    if (event.target === addExperimentModal) {
      addExperimentModal.style.display = "none";
    }
  });

  // Function to open the View Experiment modal
  function openViewModal(experimentId) {
    const experiments = JSON.parse(localStorage.getItem("experiments")) || [];
    const experiment = experiments.find((exp) => exp.id === experimentId);

    if (experiment) {
      const viewNameElement = document.getElementById("view-experiment-name");
      const viewHypothesisElement = document.getElementById("view-hypothesis");
      const viewCategoryElement = document.getElementById("view-category");
      const viewKPIElement = document.getElementById("view-kpi");
      const viewProjectedOutcomeElement = document.getElementById(
        "view-projected-outcome"
      );
      const viewActualOutcomeElement = document.getElementById(
        "view-actual-outcome"
      );
      const viewDateRangeElement = document.getElementById("view-date-range");
      const viewBudgetElement = document.getElementById("view-budget");
      const viewActualSpendElement =
        document.getElementById("view-actual-spend");
      const viewURLElement = document.getElementById("view-url");

      // Check if each element exists before trying to set its content
      if (viewNameElement)
        viewNameElement.textContent = experiment.experimentName;
      if (viewHypothesisElement)
        viewHypothesisElement.textContent = experiment.hypothesis;
      if (viewCategoryElement)
        viewCategoryElement.textContent = experiment.category;
      if (viewKPIElement) viewKPIElement.textContent = experiment.kpi;
      if (viewProjectedOutcomeElement)
        viewProjectedOutcomeElement.textContent = experiment.projectedOutcome;
      if (viewActualOutcomeElement)
        viewActualOutcomeElement.textContent = experiment.actualOutcome;
      if (viewDateRangeElement)
        viewDateRangeElement.textContent = `${experiment.startDate} - ${experiment.endDate}`;
      if (viewBudgetElement)
        viewBudgetElement.textContent = `$${experiment.budget} USD`;
      if (viewActualSpendElement)
        viewActualSpendElement.textContent = `$${experiment.actualSpend} USD`;
      if (viewURLElement) viewURLElement.textContent = experiment.url || "N/A";

      viewModal.style.display = "block";

      const editExperimentBtn = document.getElementById("edit-experiment");
      if (editExperimentBtn) {
        editExperimentBtn.removeEventListener("click", openEditModal);
        editExperimentBtn.addEventListener("click", () =>
          openEditModal(experimentId)
        );
      }

      const deleteExperimentBtn = document.getElementById("delete-experiment");

      if (editExperimentForm) {
        editExperimentForm.removeEventListener("submit", saveEditedExperiment);
        editExperimentForm.addEventListener("submit", (e) =>
          saveEditedExperiment(e, experimentId)
        );
      }
    } else {
      console.error("Experiment not found");
    }
  }

  // Function to open the Edit Experiment modal
  function openEditModal(experimentId) {
    const experiments = JSON.parse(localStorage.getItem("experiments")) || [];
    const experiment = experiments.find((exp) => exp.id === experimentId);

    if (experiment) {
      // Populate the edit modal fields with the experiment data
      document.getElementById("edit-experiment-name").value =
        experiment.experimentName;
      document.getElementById("edit-hypothesis").value = experiment.hypothesis;
      document.getElementById("edit-category").value = experiment.category;
      document.getElementById("edit-kpi").value = experiment.kpi;
      document.getElementById("edit-projected-outcome-type").value =
        experiment.projectedOutcomeType;
      document.getElementById("edit-projected-outcome-unit").value =
        experiment.projectedOutcomeUnit;
      document.getElementById("edit-projected-outcome-value").value =
        experiment.projectedOutcomeValue;
      document.getElementById("edit-actual-outcome").value =
        experiment.actualOutcome || "";
      document.getElementById("edit-start-date").value = experiment.startDate;
      document.getElementById("edit-end-date").value = experiment.endDate;
      document.getElementById("edit-budget").value = experiment.budget;
      document.getElementById("edit-actual-spend").value =
        experiment.actualSpend;
      document.getElementById("edit-url").value = experiment.url || "";

      // Open the modal
      const editModal = document.getElementById("editExperimentModal");
      editModal.style.display = "block";

      // Handle the form submission
      const editExperimentForm = document.getElementById("editExperimentForm");
      editExperimentForm.removeEventListener("submit", saveEditedExperiment);
      editExperimentForm.addEventListener("submit", (e) =>
        saveEditedExperiment(e, experimentId)
      );
    }
  }

  function saveEditedExperiment(event, experimentId) {
    event.preventDefault();
    let experiments = JSON.parse(localStorage.getItem("experiments")) || [];
    const experimentIndex = experiments.findIndex(
      (exp) => exp.id === experimentId
    );

    if (experimentIndex !== -1) {
      // Get values from the form and remove commas before saving
      experiments[experimentIndex].experimentName = document.getElementById(
        "edit-experiment-name"
      ).value;
      experiments[experimentIndex].hypothesis =
        document.getElementById("edit-hypothesis").value;
      experiments[experimentIndex].category =
        document.getElementById("edit-category").value;
      experiments[experimentIndex].kpi =
        document.getElementById("edit-kpi").value;
      experiments[experimentIndex].projectedOutcomeType =
        document.getElementById("edit-projected-outcome-type").value;
      experiments[experimentIndex].projectedOutcomeUnit =
        document.getElementById("edit-projected-outcome-unit").value;
      experiments[experimentIndex].projectedOutcomeValue =
        document.getElementById("edit-projected-outcome-value").value;
      experiments[experimentIndex].actualOutcome =
        document.getElementById("edit-actual-outcome").value || "";
      experiments[experimentIndex].startDate =
        document.getElementById("edit-start-date").value;
      experiments[experimentIndex].endDate =
        document.getElementById("edit-end-date").value;
      experiments[experimentIndex].budget =
        parseFloat(
          document.getElementById("edit-budget").value.replace(/,/g, "")
        ) || 0;
      experiments[experimentIndex].actualSpend =
        parseFloat(
          document.getElementById("edit-actual-spend").value.replace(/,/g, "")
        ) || 0;
      experiments[experimentIndex].url =
        document.getElementById("edit-url").value || "";

      experiments[experimentIndex].status = determineStatus(
        experiments[experimentIndex]
      );

      localStorage.setItem("experiments", JSON.stringify(experiments));

      // Close all modals and refresh the table
      closeAllModals();
      loadExperiments();
    }
  }

  function closeAllModals() {
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
      modal.style.display = "none";
    });
  }

  // Function to delete an experiment
  function deleteExperiment(experimentId) {
    // Retrieve experiments from local storage
    let experiments = JSON.parse(localStorage.getItem("experiments")) || [];

    // Filter out the experiment to be deleted
    experiments = experiments.filter(
      (experiment) => experiment.id !== experimentId
    );

    // Update the local storage with the remaining experiments
    localStorage.setItem("experiments", JSON.stringify(experiments));

    // Update the table and analytics
    loadExperiments();
    updateAnalytics();

    // Close the view modal
    const viewModal = document.getElementById("viewExperimentModal");
    if (viewModal) {
      viewModal.style.display = "none";
    }

    // Provide feedback to the user (optional)
    showNotification("Experiment deleted successfully.", "error");
  }

  // Attach event listener to the delete button in the view modal
  document
    .getElementById("delete-experiment")
    .addEventListener("click", function () {
      const experimentId = parseInt(this.getAttribute("data-experiment-id"));
      if (confirm("Are you sure you want to delete this experiment?")) {
        deleteExperiment(experimentId);
      }
    });

  function loadExperiments() {
    let experiments = JSON.parse(localStorage.getItem("experiments")) || [];

    // Clear the existing table rows before repopulating
    const tableBody = document.getElementById("experiments-table-body");
    tableBody.innerHTML = ""; // This clears the table

    // Repopulate the table with updated data
    experiments.forEach((experiment) => {
      experiment.status = determineStatus(experiment);
      addExperimentToTable(experiment);
    });

    // Populate the dropdowns with categories, KPIs, and statuses
    populateCategoryKPIAndStatusDropdowns(experiments);

    // Update analytics after loading existing experiments
    updateAnalytics();

    // Update the experiment count in the header
    updateExperimentCount(experiments.length);

    // Ensure click events are attached after loading experiments
    addRowClickEvents();
  }

  const categoryFilter = document.getElementById("category-filter");
  const kpiFilter = document.getElementById("kpi-filter");
  const statusFilter = document.getElementById("status-filter");

  if (categoryFilter) {
    categoryFilter.addEventListener("change", () => {
      filterExperiments();
      updateAnalytics();
    });
  }

  if (kpiFilter) {
    kpiFilter.addEventListener("change", () => {
      filterExperiments();
      updateAnalytics();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener("change", () => {
      filterExperiments();
      updateAnalytics();
    });
  }

  // Add Experiment Form Submission
document.getElementById("addExperimentForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const experiments = JSON.parse(localStorage.getItem("experiments")) || [];

  // Collect form data
  const experimentName = document.getElementById("experiment-name").value;
  const hypothesis = document.getElementById("hypothesis").value;
  const category = document.getElementById("category").value;
  const kpi = document.getElementById("kpi").value;
  const projectedOutcomeType = document.getElementById("projected-outcome-type").value;
  const projectedOutcomeUnit = document.getElementById("projected-outcome-unit").value;
  const projectedOutcomeValue = document.getElementById("projected-outcome-value").value;
  const actualOutcome = document.getElementById("actual-outcome").value || "N/A"; // Default to "N/A" if not filled
  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;

  // Format and store budget and actual spend values without formatting
  const budget = parseFloat(document.getElementById("budget").value.replace(/,/g, "")) || 0;
  const actualSpend = parseFloat(document.getElementById("actual-spend").value.replace(/,/g, "")) || 0;

  const url = document.getElementById("url").value;

  // Create a new experiment object
  const newExperiment = {
      id: Date.now(),
      experimentName,
      hypothesis,
      category,
      kpi,
      projectedOutcomeType,
      projectedOutcomeUnit,
      projectedOutcomeValue,
      actualOutcome,
      startDate,
      endDate,
      budget,
      actualSpend,
      url,
      status: "In Progress", // Default status
  };

  // Save the experiment in localStorage
  experiments.push(newExperiment);
  localStorage.setItem("experiments", JSON.stringify(experiments));

  // Close the modal and refresh the experiments table
  document.getElementById("addExperimentModal").style.display = "none";
  loadExperiments(); // Refresh the experiments list
});

  function addExperimentToTable(experiment) {
    const tableBody = document.getElementById("experiments-table-body");
    const newRow = document.createElement("tr");
    const status = determineStatus(experiment);

    // Check if all necessary data for projected outcome exists
    let projectedOutcomeDisplay =
      experiment.projectedOutcomeType &&
      experiment.projectedOutcomeUnit &&
      experiment.projectedOutcomeValue
        ? `${
            experiment.projectedOutcomeType.charAt(0).toUpperCase() +
            experiment.projectedOutcomeType.slice(1)
          } ${experiment.projectedOutcomeValue}${
            experiment.projectedOutcomeUnit === "percentage"
              ? "%"
              : experiment.projectedOutcomeUnit === "number"
              ? ""
              : experiment.projectedOutcomeUnit
          }`
        : "N/A";

    // Format actualOutcome with the correct unit
    let actualOutcomeWithUnit = experiment.actualOutcome
      ? `${experiment.actualOutcome}${
          experiment.projectedOutcomeUnit === "percentage"
            ? "%"
            : experiment.projectedOutcomeUnit === "number"
            ? ""
            : experiment.projectedOutcomeUnit
        }`
      : "N/A";

    // Convert budget and actualSpend to floats for comparison
    const budget = parseFloat(experiment.budget) || 0;
    const actualSpend = parseFloat(experiment.actualSpend) || 0;

    // Assign a unique identifier to the row
    newRow.setAttribute("data-experiment-id", experiment.id);

    newRow.innerHTML = `
              <td class="experiment-name-column">${
                experiment.experimentName
              }</td>
              <td>${experiment.category}</td>
              <td>${experiment.startDate} - ${experiment.endDate}</td>
              <td>${experiment.kpi}</td>
              <td>${projectedOutcomeDisplay}</td>
              <td>${actualOutcomeWithUnit}</td>
               <td>$${formatNumberForTable(budget.toFixed(2))} USD</td>
  <td class="${actualSpend > budget ? "exceeds-budget" : ""}">$${formatNumberForTable(actualSpend.toFixed(2))} USD</td>
              <td>${determinePotential(experiment)}</td>
              <td><span class="status-dot ${status.toLowerCase()}"></span>${status}</td>

          `;

    tableBody.appendChild(newRow);

    // Attach click event to open the modal with details
    newRow.addEventListener("click", () => {
      openViewModal(experiment.id);
    });
  }

  function calculatePotentialScore(experiment) {
    // Extracting necessary data
    const projectedValue = parseFloat(experiment.projectedOutcomeValue) || 0;
    const actualValue = parseFloat(experiment.actualOutcome) || 0;
    const projectedUnit = experiment.projectedOutcomeUnit || "number";
    const budget = parseFloat(experiment.budget) || 0;
    const actualSpend = parseFloat(experiment.actualSpend) || 0;
    const startDate = new Date(experiment.startDate);
    const endDate = new Date(experiment.endDate);
    const daysTaken = (endDate - startDate) / (1000 * 3600 * 24) || 1;
  
    // 1. Outcome Evaluation Score
    let outcomeScore = 0;
    const outcomeDifference = Math.abs(actualValue - projectedValue);
  
    if (projectedUnit === "%" || projectedUnit === "percentage") {
      // For percentage values
      outcomeScore =
        outcomeDifference <= 5
          ? 3
          : outcomeDifference <= 10
          ? 2
          : 1;
    } else {
      // For plain number values
      const outcomeRatio = actualValue / projectedValue;
      outcomeScore =
        outcomeRatio >= 0.9
          ? 3
          : outcomeRatio >= 0.75
          ? 2
          : 1;
    }
  
    // 2. Budget Analysis Score
    let budgetScore = 0;
    const budgetRatio = actualSpend / budget;
  
    if (actualSpend <= budget) {
      budgetScore =
        actualSpend === 0
          ? 1
          : budgetRatio >= 0.75
          ? 3
          : 2;
    } else {
      budgetScore = budgetRatio > 1.25 ? 1 : 2;
    }
  
    // 3. Time Efficiency Score
    let timeScore = 0;
  
    if (daysTaken <= 7) {
      timeScore = 3;
    } else if (daysTaken <= 14) {
      timeScore = 2;
    } else {
      timeScore = 1;
    }
  
    // Assigning weights to each criteria (change these weights as per importance)
    const outcomeWeight = 0.5;
    const budgetWeight = 0.3;
    const timeWeight = 0.2;
  
    // Calculating the final weighted score
    const finalScore =
      outcomeScore * outcomeWeight +
      budgetScore * budgetWeight +
      timeScore * timeWeight;
  
    // Return the final potential as "High", "Medium", or "Low" based on the score
    if (finalScore >= 2.5) {
      return "High";
    } else if (finalScore >= 1.75) {
      return "Medium";
    } else {
      return "Low";
    }
  }

  // Determine potential
  function determinePotential(experiment) {
    return calculatePotentialScore(experiment);
  }

  function determineStatus(experiment) {
    const currentDate = new Date();
    const endDate = new Date(experiment.endDate);

    return currentDate < endDate ? "In Progress" : "Completed";
  }

  function formatNumberWithCommasAndDecimals(value) {
    if (isNaN(value) || value === "") return ""; // Handle invalid or empty input
    let number = parseFloat(value).toFixed(2); // Ensure two decimal places
    let [integerPart, decimalPart] = number.split("."); // Split into integer and decimal parts

    // Format the number with commas, without inserting HTML tags
    return `${integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${decimalPart}`;
}

  function formatNumberForTable(value) {
    if (isNaN(value) || value === "") return ""; // Handle invalid or empty input
    let number = parseFloat(value).toFixed(2); // Ensure two decimal places
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ","); // Add commas
  }

  document.querySelectorAll("#budget, #actual-spend").forEach(function (input) {
    input.addEventListener("blur", function (e) {
        let rawValue = e.target.value.replace(/,/g, ""); // Remove commas for processing
        if (!isNaN(rawValue) && rawValue !== "") {
            e.target.value = formatNumberWithCommasAndDecimals(rawValue); // Format and set value
        }
    });

    // Ensure that on focus, the input value is without formatting (commas)
    input.addEventListener("focus", function (e) {
        e.target.value = e.target.value.replace(/,/g, ""); // Remove commas when focused
    });
});

  // Event listener to format input (for both budget and actual spend) on blur in the Edit Experiment form
  document
    .querySelectorAll("#edit-budget, #edit-actual-spend")
    .forEach(function (input) {
      input.addEventListener("blur", function (e) {
        let rawValue = e.target.value.replace(/,/g, ""); // Remove commas for processing
        if (!isNaN(rawValue) && rawValue !== "") {
          e.target.value = formatNumberWithCommasAndDecimals(rawValue); // Format and set value
        }
      });

      // Ensure that on focus, the input value is without formatting (commas)
      input.addEventListener("focus", function (e) {
        e.target.value = e.target.value.replace(/,/g, ""); // Remove commas when focused
      });
    });

    function updateAnalytics() {
        let experiments = JSON.parse(localStorage.getItem("experiments")) || [];
        let totalSpending = 0;
        let totalBudget = 0;
        let categoryTotals = {};
    
        // Apply filters to the experiments
        const selectedCategory = document.getElementById("category-filter").value;
        const selectedKPI = document.getElementById("kpi-filter").value;
        const selectedStatus = document.getElementById("status-filter").value;
    
        const filteredExperiments = experiments.filter((experiment) => {
          let matchesCategory = selectedCategory
            ? experiment.category === selectedCategory
            : true;
          let matchesKPI = selectedKPI ? experiment.kpi === selectedKPI : true;
          let matchesStatus = selectedStatus
            ? experiment.status === selectedStatus
            : true;
    
          return matchesCategory && matchesKPI && matchesStatus;
        });
    
        filteredExperiments.forEach((experiment) => {
          const budget =
            parseFloat(
              typeof experiment.budget === "string"
                ? experiment.budget.replace(/,/g, "")
                : experiment.budget
            ) || 0;
          const actualSpend =
            parseFloat(
              typeof experiment.actualSpend === "string"
                ? experiment.actualSpend.replace(/,/g, "")
                : experiment.actualSpend
            ) || 0;
    
          totalBudget += budget;
          totalSpending += actualSpend;
    
          // Summing categories
          if (categoryTotals[experiment.category]) {
            categoryTotals[experiment.category] += actualSpend || 0;
          } else {
            categoryTotals[experiment.category] = actualSpend || 0;
          }
        });
    
        // Format and display total budget and spending with .cents class
        document.getElementById("total-budget").innerHTML = formatNumberWithCommasAndDecimals(totalBudget);
        document.getElementById("total-spending").innerHTML = formatNumberWithCommasAndDecimals(totalSpending);

    
        updateChart(categoryTotals);
        updateChartLegend(categoryTotals);
    
        getTopPerformingExperiments();
        calculateIterationPotential();
    }

  function getTopPerformingExperiments() {
    let experiments = JSON.parse(localStorage.getItem("experiments")) || [];

    // Sort by performance, assuming 'actualOutcome' is the value to be considered
    experiments.sort((a, b) => {
      if (a.projectedOutcomeType === "Decrease") {
        return parseFloat(a.actualOutcome) - parseFloat(b.actualOutcome); // For Decrease, lower is better
      } else {
        return parseFloat(b.actualOutcome) - parseFloat(a.actualOutcome); // For Increase, higher is better
      }
    });

    // Filter experiments to only include those with "High" or "Medium" potential
    let filteredExperiments = experiments.filter((exp) => {
      const potential = determinePotential(exp);
      return potential === "High" || potential === "Medium";
    });

    // Take top three filtered experiments
    let topExperiments = filteredExperiments.slice(0, 3);

    // Display them in the UI as a list with <li> elements, keeping the original indexing
    const topExperimentsElement = document.getElementById("top-experiments");
    topExperimentsElement.innerHTML = topExperiments.length
      ? topExperiments
          .map((exp, index) => {
            let outcome = exp.actualOutcome;
            let unit = exp.projectedOutcomeUnit === "percentage" ? "%" : "";

            return `<li>${index + 1}. ${exp.experimentName} 
                          <span class="ticker-style success-ticker">
                          ${outcome}${unit} ${
              exp.projectedOutcomeType === "Decrease" ? "Decrease" : "Increase"
            }</span></li>`;
          })
          .join("")
      : "No experiment has good performance :(";
  }

  function calculateIterationPotential() {
    let experiments = JSON.parse(localStorage.getItem("experiments")) || [];
    let highPotentialCount = 0;

    experiments.forEach((experiment) => {
      const projected = parseFloat(experiment.projectedOutcomeValue);
      const actual = parseFloat(experiment.actualOutcome);

      if (!isNaN(projected) && !isNaN(actual)) {
        const difference = Math.abs(projected - actual);
        if (difference <= 5) {
          highPotentialCount++;
        }
      }
    });

    const iterationPotentialPercentage =
      (highPotentialCount / experiments.length) * 100;
    document.getElementById("iteration-potential").innerHTML = `
          <span class="iteration-percentage">${iterationPotentialPercentage.toFixed(
            2
          )}%</span>
        `;
  }

  // Function to update the chart with category totals
  function updateChart(categoryTotals) {
    const categories = Object.keys(categoryTotals);
    const totals = Object.values(categoryTotals);

    // Update chart data
    spendingChart.data.labels = categories;
    spendingChart.data.datasets[0].data = totals;
    spendingChart.update();
  }

  // Function to update the chart legend
  function updateChartLegend(categoryTotals) {
    const legendElement = document.getElementById("spendingIndex");
    legendElement.innerHTML = ""; // Clear existing legend

    const colors = ["#81c784", "#e57373", "#b39ddb", "#bcaaa4"]; // Add more colors if necessary

    Object.keys(categoryTotals).forEach((category, index) => {
      const listItem = document.createElement("li");
      listItem.innerHTML = `<span class="legend-color" style="background-color: ${
        colors[index % colors.length]
      }"></span> ${category}`;
      legendElement.appendChild(listItem);
    });
  }

  function filterExperiments(start, end) {
    const categoryFilter = document.getElementById("category-filter").value;
    const kpiFilter = document.getElementById("kpi-filter").value;
    const statusFilter = document.getElementById("status-filter").value;
    const selectedStatus = document.getElementById("status-filter").value;

    let experiments = JSON.parse(localStorage.getItem("experiments")) || [];

    experiments = experiments.filter((experiment) => {
      experiment.status = determineStatus(experiment);
      return selectedStatus ? experiment.status === selectedStatus : true;
    });

    // Apply category filter
    if (categoryFilter) {
      experiments = experiments.filter(
        (experiment) => experiment.category === categoryFilter
      );
    }

    // Apply KPI filter
    if (kpiFilter) {
      experiments = experiments.filter(
        (experiment) => experiment.kpi === kpiFilter
      );
    }

    // Apply status filter
    if (statusFilter) {
      experiments = experiments.filter(
        (experiment) => experiment.status === statusFilter
      );
    }

    // Apply date range filter if start and end dates are provided
    if (start && end) {
      experiments = experiments.filter((experiment) => {
        const experimentStart = new Date(experiment.startDate);
        const experimentEnd = new Date(experiment.endDate);
        return (
          experimentStart >= new Date(start) && experimentEnd <= new Date(end)
        );
      });
    }

    // Update the table with filtered experiments
    updateFilteredTable(experiments);
    updateAnalytics(); // Make sure analytics are updated after filtering
  }

  function updateFilteredTable(filteredExperiments) {
    const tableBody = document.getElementById("experiments-table-body");
    tableBody.innerHTML = ""; // Clear existing table rows

    if (filteredExperiments.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="11">No matching experiments found.</td></tr>';
    } else {
      filteredExperiments.forEach((experiment) => {
        addExperimentToTable(experiment); // This function should add a row to the table
      });
    }

    // Reattach click events after updating the table
    addRowClickEvents();
  }

  // Function to update the experiment count in the header
  function updateExperimentCount(count) {
    const experimentCountElement = document.getElementById("experiment-count");
    experimentCountElement.textContent = ` - ${count}`;
  }

  $(function () {
    $("#date-range-filter").daterangepicker(
      {
        opens: "right",
        autoUpdateInput: false, // Disable auto-update for custom placeholders
        locale: {
          format: "MM/DD/YYYY",
          applyLabel: "Apply",
          cancelLabel: "Cancel",
          fromLabel: "From",
          toLabel: "To",
        },
      },
      function (start, end) {
        $("#date-range-filter").val(
          start.format("MM/DD/YYYY") + " - " + end.format("MM/DD/YYYY")
        );
        filterExperiments(start.format("MM/DD/YYYY"), end.format("MM/DD/YYYY")); // Apply the selected date range
      }
    );

    // Set the placeholder manually for the initial load
    $("#date-range-filter").attr("placeholder", "From - To");

    // Handle cancel (clear the filter)
    $("#date-range-filter").on("cancel.daterangepicker", function () {
      $(this).val(""); // Clear the input
      filterExperiments(); // Call the filter function with no date constraints to reset
    });
  });

  $(function () {
    $("#export-date-range").daterangepicker(
      {
        opens: "right",
        autoUpdateInput: false,
        locale: {
          format: "MM/DD/YYYY",
          applyLabel: "Apply",
          cancelLabel: "Cancel",
          fromLabel: "From",
          toLabel: "To",
        },
      },
      function (start, end) {
        $("#export-date-range").val(
          start.format("MM/DD/YYYY") + " - " + end.format("MM/DD/YYYY")
        );
        // Apply the selected date range logic for export here if needed
      }
    );

    $("#export-date-range").attr("placeholder", "From - To");

    $("#export-date-range").on("cancel.daterangepicker", function () {
      $(this).val(""); // Clear the input
      // Reset any export filters here if needed
    });
  });

  // Function to populate the dropdowns with unique options
  function populateCategoryKPIAndStatusDropdowns(experiments) {
    const categoryFilter = document.getElementById("category-filter");
    const kpiFilter = document.getElementById("kpi-filter");
    const statusFilter = document.getElementById("status-filter");

    // Clear existing options
    categoryFilter.innerHTML = '<option value="">Categories</option>';
    kpiFilter.innerHTML = '<option value="">KPIs</option>';
    statusFilter.innerHTML = '<option value="">Status</option>';

    const uniqueCategories = new Set();
    const uniqueKPIs = new Set();
    const uniqueStatuses = new Set();

    experiments.forEach((experiment) => {
      uniqueCategories.add(experiment.category);
      uniqueKPIs.add(experiment.kpi);
      uniqueStatuses.add(experiment.status);
    });

    // Populate the filters
    uniqueCategories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });

    uniqueKPIs.forEach((kpi) => {
      const option = document.createElement("option");
      option.value = kpi;
      option.textContent = kpi;
      kpiFilter.appendChild(option);
    });

    uniqueStatuses.forEach((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      statusFilter.appendChild(option);
    });
  }

  function populateCategoryKPIAndStatusDropdownsForExportModal(experiments) {
    const categoryFilter = document.getElementById("export-category-filter");
    const kpiFilter = document.getElementById("export-kpi-filter");
    const statusFilter = document.getElementById("export-status-filter");

    // Clear existing options
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    kpiFilter.innerHTML = '<option value="">All KPIs</option>';
    statusFilter.innerHTML = '<option value="">All Statuses</option>';

    const uniqueCategories = new Set();
    const uniqueKPIs = new Set();
    const uniqueStatuses = new Set();

    experiments.forEach((experiment) => {
      uniqueCategories.add(experiment.category);
      uniqueKPIs.add(experiment.kpi);
      uniqueStatuses.add(experiment.status);
    });

    uniqueCategories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });

    uniqueKPIs.forEach((kpi) => {
      const option = document.createElement("option");
      option.value = kpi;
      option.textContent = kpi;
      kpiFilter.appendChild(option);
    });

    uniqueStatuses.forEach((status) => {
      const option = document.createElement("option");
      option.value = status;
      option.textContent = status;
      statusFilter.appendChild(option);
    });
  }

  function showNotification(message, type = "success") {
    const container = document.getElementById("notification-container");
    const notification = document.createElement("div");
    notification.classList.add("notification", type);

    notification.innerHTML = `
        <span>${message}</span>
        <span class="close-btn">&times;</span>
    `;

    container.appendChild(notification);

    // Auto-remove the notification after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);

    // Remove notification on close button click
    notification.querySelector(".close-btn").addEventListener("click", () => {
      notification.remove();
    });
  }

  // Example usage for reminders
  function remindEndingExperiments() {
    let experiments = JSON.parse(localStorage.getItem("experiments")) || [];
    const today = new Date().toISOString().split("T")[0];

    let endingToday = experiments.filter(
      (experiment) => experiment.endDate === today
    );

    if (endingToday.length > 0) {
      const experimentNames = endingToday
        .map((exp) => exp.experimentName)
        .join(", ");
      showNotification(
        `The following experiments end today: ${experimentNames}`,
        "success"
      );
    }
  }




  
  loadExperiments();
  populateCategoryKPIAndStatusDropdownsForExportModal(experiments);
  remindEndingExperiments();
  updateLastExportTime();
  updateLastExportDisplay(); // Ensure the last export note is displayed on load

});

// Function to generate a 6-digit random number
function generateRandomSerial() {
  return Math.floor(100000 + Math.random() * 900000);
}

// Retrieve and format the username
const rawUsername = localStorage.getItem("mithrUsername");

let formattedUsername = rawUsername ? rawUsername.trim().replace(/\s+/g, '-').toLowerCase() : "anonymous";

// Check if the userId already exists in local storage
let userId = localStorage.getItem("userId");

if (!userId) {
  // If no userId is found, generate a new one using the formatted username
  userId = formattedUsername + generateRandomSerial();

  // Store the generated userId in local storage
  localStorage.setItem("userId", userId);
}

document.getElementById("invite-btn").addEventListener("click", function () {
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

// Doughnut Chart functionality
const ctx = document.getElementById("spendingChart").getContext("2d");
const spendingChart = new Chart(ctx, {
  type: "doughnut",
  data: {
    labels: [], // We'll dynamically populate this
    datasets: [
      {
        data: [], // We'll dynamically populate this
        backgroundColor: ["#81c784", "#e57373", "#b39ddb", "#bcaaa4"], // Add more colors as needed
        hoverBackgroundColor: ["#66bb6a", "#ef5350", "#9575cd", "#a1887f"],
      },
    ],
  },
  options: {
    cutout: "70%",
    responsive: true,
    plugins: {
      legend: {
        display: false, // We'll use our custom legend
      },
      tooltip: {
        padding: 10, // Adjust padding for more space
        bodyFont: {
          size: 14, // Adjust font size to make text fit better
        },
        usePointStyle: true, // This makes the legend a circle by default
        callbacks: {
          label: function (tooltipItem) {
            const value = tooltipItem.raw; // The raw value from the dataset
            return ` $${value.toLocaleString()}`; // Only display the value with a dollar sign
          },
          title: function (tooltipItems) {
            return tooltipItems[0].label; // Display only the category name as the title
          },
        },
      },
    },
  },
});

// Function to set the dashboard title with the user's name
function setDashboardTitle() {
  const username = localStorage.getItem("mithrUsername");
  if (username) {
    const dashboardTitleElement = document.getElementById("dashboard-title");
    dashboardTitleElement.textContent = `Hello, ${username}`;
  }
}

// Call setDashboardTitle when the page loads
document.addEventListener("DOMContentLoaded", () => {
  setDashboardTitle();
});
