const fs = require('fs');
const path = require('path');

// Define the pattern to match test case IDs ending with either a colon or a space
const pattern = /C(\d+)(:|\s)/g;

// Function to extract test case IDs from files in a directory
function extractCaseIds(directoryPath) {
    return new Promise((resolve, reject) => {
        // List to hold all test case IDs
        let testCaseIds = [];

        // Read files from the directory
        fs.readdir(directoryPath, (err, files) => {
            if (err) {
                return reject('Error reading the directory: ' + err);
            }

            // Track the number of files and directories processed
            let pendingOperations = files.length;
            if (pendingOperations === 0) {
                // If there are no files, resolve immediately
                return resolve(testCaseIds);
            }

            // Function to resolve the promise when all operations are done
            const checkComplete = () => {
                if (--pendingOperations === 0) {
                    // Remove duplicates and sort the list
                    testCaseIds = [...new Set(testCaseIds)].sort((a, b) => a - b);
                    resolve(testCaseIds);
                }
            };

            files.forEach(file => {
                const filePath = path.join(directoryPath, file);

                // Check if the path is a file or directory
                fs.stat(filePath, (err, stats) => {
                    if (err) {
                        return reject('Error getting file stats: ' + err);
                    }

                    if (stats.isFile()) {
                        // Read the content of the file
                        fs.readFile(filePath, 'utf8', (err, content) => {
                            if (err) {
                                return reject('Error reading file: ' + err);
                            }

                            // Find all matches of the pattern
                            let matches;
                            while ((matches = pattern.exec(content)) !== null) {
                                // Convert matches to integers and add to the list
                                testCaseIds.push(parseInt(matches[1], 10));
                            }

                            checkComplete();
                        });
                    } else if (stats.isDirectory()) {
                        // Recursively process subdirectories
                        extractCaseIds(filePath).then(ids => {
                            testCaseIds = testCaseIds.concat(ids);
                            checkComplete();
                        }).catch(reject);
                    } else {
                        checkComplete(); // Handle other cases if necessary
                    }
                });
            });
        });
    });
}

module.exports = extractCaseIds;