let _placeholderTableHTML = null;

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("multiplicationForm");
    if (form) {
        form.addEventListener("submit", (ev) => {
            ev.preventDefault();
            handleFormSubmit(ev.target);
        });
    }

    // Save original placeholder table HTML so we can revert to it later if inputs are invalid
    const container = document.getElementById("tableContainer");
    if (container) {
        const placeholder = container.querySelector('.multiplicationTable');
        if (placeholder) _placeholderTableHTML = placeholder.outerHTML;
    }
});

function handleFormSubmit(formElement) {
    const formData = new FormData(formElement);

    const minimumColumnCount = formData.get("minimumColumnValue");
    const maximumColumnCount = formData.get("maximumColumnValue");
    const minimumRowCount = formData.get("minimumRowValue");
    const maximumRowCount = formData.get("maximumRowValue");

    //console.log(minimumColumnCount, maximumColumnCount, minimumRowCount, maximumRowCount);

    const safelyParsedValues = {
        minimumColumnValue: typeAndValueValidator(minimumColumnCount),// function will be called to check the type and value of the inputted values
        maximumColumnValue: typeAndValueValidator(maximumColumnCount),
        minimumRowValue: typeAndValueValidator(minimumRowCount),
        maximumRowValue: typeAndValueValidator(maximumRowCount),
    };

    const invalidEntriesList = Object.entries(safelyParsedValues)// for any invalid entries this will display and notify the user
        .filter(([k, v]) => v === null)
        .map(([k]) => k);

    if (invalidEntriesList.length) {
        showMessage("Please enter valid numbers for: " + invalidEntriesList.join(", "));
        return;
    }
    console.log("FormData submit parsed values:", safelyParsedValues);
    showMessage("Form values read(see console).");

    // Now we handle values and create a table
    const container = document.getElementById("tableContainer");
    if (!container) {
        console.error('No #tableContainer element found in the DOM');
        showMessage('Internal error: missing table container');
        return;
    }
    // If the user supplied a max that's less than the min for either axis, revert to the
    // original placeholder table instead of trying to generate a swapped table.
    if (safelyParsedValues.maximumColumnValue < safelyParsedValues.minimumColumnValue ||
        safelyParsedValues.maximumRowValue < safelyParsedValues.minimumRowValue) {
        if (_placeholderTableHTML) {
            container.innerHTML = _placeholderTableHTML;
            showMessage('Invalid ranges (max < min). Reverted to placeholder table.');
        } else {
            container.innerHTML = '';
            showMessage('Invalid ranges (max < min). No placeholder available.');
        }
        return;
    }
    // Build the table using a clear min/max parameter order: (colMin, colMax, rowMin, rowMax)
    const newTable = buildTableFragment(
        safelyParsedValues.minimumColumnValue,
        safelyParsedValues.maximumColumnValue,
        safelyParsedValues.minimumRowValue,
        safelyParsedValues.maximumRowValue
    );
    container.innerHTML = "";
    container.appendChild(newTable);
}

function typeAndValueValidator(inputValue) {
    if (inputValue === null || inputValue === undefined) return null;
    const stringInputValue = String(inputValue).trim();
    if (stringInputValue === "") return null;
    const numberInputValue = Number(stringInputValue);

    return Number.isFinite(numberInputValue) ? numberInputValue : null;
}

//temp handler for errors if i determine that this is an allowed manner for this assignnment
function showMessage(text, timeout = 3000) {
    let container = document.getElementById("exampleJsMessage");
    if (!container) {
        container = document.createElement("div");
        container.id = "exampleJsMessage";
        // Minimal inline styles so it appears without CSS changes
        container.style.position = "fixed";
        container.style.right = "12px";
        container.style.bottom = "12px";
        container.style.background = "rgba(0,0,0,0.8)";
        container.style.color = "white";
        container.style.padding = "8px 12px";
        container.style.borderRadius = "6px";
        container.style.fontFamily = "sans-serif";
        container.style.zIndex = "9999";
        document.body.appendChild(container);
    }
    container.textContent = text;
    if (timeout > 0) {
        setTimeout(() => {
            if (container.parentNode) container.parentNode.removeChild(container);
        }, timeout);
    }
}

function buildTableFragment(columnMin, columnMax, rowMin, rowMax) {
    // Coerce to numbers
    columnMin = Number(columnMin);
    columnMax = Number(columnMax);
    rowMin = Number(rowMin);
    rowMax = Number(rowMax);

    // Use integer ranges - truncate floats to integers
    columnMin = Math.trunc(columnMin);
    columnMax = Math.trunc(columnMax);
    rowMin = Math.trunc(rowMin);
    rowMax = Math.trunc(rowMax);

    // Debug: log the numeric ranges actually used
    console.debug('buildTableFragment params (colMin, colMax, rowMin, rowMax):', columnMin, columnMax, rowMin, rowMax);

    // Basic validation
    if (![columnMin, columnMax, rowMin, rowMax].every(Number.isFinite)) {
        const err = document.createElement("div");
        err.textContent = "Invalid range values";
        return err;
    }

    // Swap if min > max
    if (columnMin > columnMax) [columnMin, columnMax] = [columnMax, columnMin];
    if (rowMin > rowMax) [rowMin, rowMax] = [rowMax, rowMin];

    const table = document.createElement("table");
    table.className = "generatedTable";

    // Thead with column headers
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const topLeft = document.createElement("th"); // empty top-left cell
    topLeft.setAttribute('scope', 'col');
    headerRow.appendChild(topLeft);
    for (let c = columnMin; c <= columnMax; c++) {
        const th = document.createElement("th");
        th.setAttribute('scope', 'col');
        th.textContent = String(c);
        headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Tbody with row headers and products
    const tbody = document.createElement("tbody");
    const frag = document.createDocumentFragment();
    for (let r = rowMin; r <= rowMax; r++) {
        const tr = document.createElement("tr");
        const rowHeader = document.createElement("th");
        rowHeader.setAttribute('scope', 'row');
        rowHeader.textContent = String(r);
        tr.appendChild(rowHeader);

        for (let c = columnMin; c <= columnMax; c++) {
            const td = document.createElement("td");
            td.textContent = String(r * c);
            tr.appendChild(td);
        }
        frag.appendChild(tr);
    }
    tbody.appendChild(frag);
    table.appendChild(tbody);
    return table;
}