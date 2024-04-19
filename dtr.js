const fs = require('fs');
const readline = require('readline');
const path = require('path');

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
};

const dtrFilePath = path.resolve(__dirname, 'dtr.json');

var twirlTimer = (function() {
    var dots = "";
    var count = 0;
    process.stdout.write("Loading");
    return setInterval(function() {
      process.stdout.write("\rLoading" + dots);
      dots += ".";
      count++;
      if (count === 4) {
        process.stdout.write("\rLoading   "); // Clear the dots
        dots = "";
        count = 0;
      }
    }, 300);
  })();
  
function checkDTRData(){
    fs.readFile('dtr.json', 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading the file:', err);
          return;
        }
      
        try {
          const jsonData = JSON.parse(data);
          console.log('DTR Data:');
          console.log(jsonData);
          setTimeout(() => {
            console.clear()
            askUserAction();
          },5000)
        } catch (error) {
          console.error('Error parsing JSON data:', error);
        }
    });      
}

function checkDTRDataWithoutAsking(){
    fs.readFile('dtr.json', 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading the file:', err);
          return;
        }
      
        try {
          const jsonData = JSON.parse(data);
          console.log('DTR Data:');
          console.log(jsonData);
        } catch (error) {
          console.error('Error parsing JSON data:', error);
        }
    });      
}

function deleteDTRData() {
    fs.readFile(dtrFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(colors.red + 'Error reading the file:' + colors.reset, err);
            return;
        }

        let dtrData = JSON.parse(data);
        console.log('Current DTR Entries:');
        dtrData.forEach((entry, index) => {
            console.log(`${index + 1}: Date: ${entry.date}, Time In: ${entry.timeIn}, Time Out: ${entry.timeOut}`);
        });

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Enter the number of the entry you want to delete: ', (number) => {
            const index = parseInt(number, 10) - 1;
            if (index >= 0 && index < dtrData.length) {
                dtrData.splice(index, 1); // Remove the entry
                fs.writeFile(dtrFilePath, JSON.stringify(dtrData, null, 2), (err) => {
                    if (err) {
                        console.error(colors.red + 'Error writing to file:' + colors.reset, err);
                        return;
                    }
                    console.log(colors.green + 'DTR entry deleted successfully!' + colors.reset);
                });
            } else {
                console.log(colors.red + 'Invalid entry number.' + colors.reset);
            }
            rl.close();
            console.clear()
            askUserAction(); // Return to main menu
        });
    });
}


// function calculateHours(timeIn, timeOut) {
//     // Calculation logic here...
// }

function calculateTotalHours(dtrData) {
    if (!Array.isArray(dtrData) || dtrData.length === 0) {
        return { totalHours: 0, remainingMinutes: 0 };
    }

    let totalMinutes = 0;

    dtrData.forEach(entry => {
        if (typeof entry.timeIn !== 'string' || typeof entry.timeOut !== 'string') {
            return; // Skip invalid entries
        }

        const timeInParts = entry.timeIn.split(':').map(part => parseInt(part, 10));
        const timeOutParts = entry.timeOut.split(':').map(part => parseInt(part, 10));

        if (timeInParts.length !== 2 || timeOutParts.length !== 2 ||
            isNaN(timeInParts[0]) || isNaN(timeInParts[1]) ||
            isNaN(timeOutParts[0]) || isNaN(timeOutParts[1])) {
            return; // Skip invalid time format
        }

        const hoursWorked = timeOutParts[0] - timeInParts[0];
        const minutesWorked = timeOutParts[1] - timeInParts[1];

        if (hoursWorked < 0 || (hoursWorked === 0 && minutesWorked < 0)) {
            return; // Skip negative durations
        }

        totalMinutes += (hoursWorked * 60 + minutesWorked);
    });

    // Deduct 1 hour for lunch break for each working day
    const workingDays = dtrData.filter(entry => {
        // Assuming working days are Monday to Friday (1 to 5)
        const date = new Date(entry.date);
        const dayOfWeek = date.getDay();
        return dayOfWeek >= 1 && dayOfWeek <= 5;
    });
    
    totalMinutes -= workingDays.length * 60;

    // Ensure total minutes is non-negative
    if (totalMinutes < 0) {
        totalMinutes = 0;
    }

    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    return { totalHours, remainingMinutes };
}



function printParsedData(dtrData, totalHours, remainingMinutes) {
    // Printing logic here...
}

function printTotalHoursAndMinutes(totalHours, remainingMinutes) {
    console.log(`Total hours: ${totalHours}, Total minutes: ${remainingMinutes}`);
}

function addNewDTRData(newData) {
    fs.readFile(dtrFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(colors.red + 'Error reading the file:' + colors.reset, err);
            return;
        }

        let dtrData = [];
        if (data) {
            dtrData = JSON.parse(data);
        }

        dtrData.push(newData);

        const newDataJson = JSON.stringify(dtrData, null, 2);

        fs.writeFile(dtrFilePath, newDataJson, (err) => {
            if (err) {
                console.error(colors.red + 'Error writing to file:' + colors.reset, err);
                return;
            }

            console.log(colors.green + 'New DTR data added successfully!' + colors.reset);
            
            // Calculate total hours and minutes
            const { totalHours, remainingMinutes } = calculateTotalHours(dtrData);
            
            // Print total hours and minutes
            // printTotalHoursAndMinutes(totalHours, remainingMinutes);

            // Print parsed data
            printParsedData(dtrData, totalHours, remainingMinutes);

            // Ask if the user wants to input another DTR
            askInputAnotherDTR();
        });
    });
}

function askInputAnotherDTR() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Do you want to input another DTR? (yes/no): ', (answer) => {
        if ((/^(?:y|yes)$/i).test(answer)) {
            rl.close();
            console.clear(); 
            promptNewDTRData();
        } else if ((/^(no|No|N|n)$/).test(answer)) {
            rl.close();
            // process.exit();
            console.clear();
            askUserAction();
        } else {
            rl.close();
            console.clear();
            console.log(colors.red + 'Invalid input. Please enter "yes" or "no".' + colors.reset);
            askInputAnotherDTR();
        }
    });
}

function validateTimeFormat(time) {
    const timeFormat = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeFormat.test(time);
}

function promptNewDTRData() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Enter date (YYYY-MM-DD): ', (date) => {
        rl.question('Enter time in (HH:MM): ', (timeIn) => {
            rl.question('Enter time out (HH:MM): ', (timeOut) => {
                rl.close();

                // Validate input format
                if (!validateTimeFormat(timeIn) || !validateTimeFormat(timeOut)) {
                    console.clear(); // Clear the console
                    console.log(colors.red + 'Invalid time format. Please enter time in HH:MM format.' + colors.reset);
                    promptNewDTRData(); // Repeat input process
                    return;
                }

                // Create new DTR data object
                const newData = { date, timeIn, timeOut };

                // Add new DTR data to the JSON file
                addNewDTRData(newData);
            });
        });
    });
}

  
function askUserAction() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    console.clear();
    setTimeout(function() {
        clearInterval(twirlTimer); // Clear the interval

    rl.question('Choose an option:\n\n[calculate total hours and minute]\n[add a new DTR]\n[check DTR]\n[or delete a DTR entry]\n[exit/quit]\n\n(calculate/add/check/delete/exit): ', (answer) => {
        rl.close();
        if ((/^(?:calculate|c)$/i).test(answer)) {
            console.clear()
            readAndCalculateTotalHours();
        } else if ((/^(?:add|a)$/i).test(answer)) {
            console.clear()
            promptNewDTRData();
        } 
        else if ((/^(?:check|ch)$/i).test(answer)) {
            console.clear()
            checkDTRData();
        }else if ((/^(?:delete|d)$/i).test(answer)) {
            console.clear()
            deleteDTRData();
        } else if ((/^(exit|quit|e|q)$/).test(answer)) {
            rl.close();
            console.clear()
            console.log("Thanks for using, Comeback next time!")
            return 0;
        } else {
            console.clear();
            console.log(colors.red + 'Invalid input. Please enter "calculate", "add", or "delete".' + colors.reset);
            askUserAction();
        }
    });
    }, 3000);
}


function readAndCalculateTotalHours() {
    checkDTRDataWithoutAsking();

    setTimeout(() => {
        fs.readFile(dtrFilePath, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading the file:', err);
                return;
            }
    
            let dtrData = [];
            if (data) {
                dtrData = JSON.parse(data);
            }
    
            // Calculate total hours and minutes
            const { totalHours, remainingMinutes } = calculateTotalHours(dtrData);
    
            printTotalHoursAndMinutes(totalHours, remainingMinutes);
    
            printParsedData(dtrData, totalHours, remainingMinutes);
    
            askInputAnotherDTR();
    
        });
    },2000)
}

// Start by asking the user whether to calculate, add new DTR and delete DTR
askUserAction();
