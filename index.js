const express = require('express');
const fs = require('fs');
const app = express();

// Load the existing data from sim.json
let simData = {};
const simPath = './sim.json';
if (fs.existsSync(simPath)) {
  const data = fs.readFileSync(simPath);
  simData = JSON.parse(data);
}

// Teach endpoint
app.get('/teach', (req, res) => {
  const { q, r } = req.query;

  if (!q || !r) {
    return res.status(400).json({ error: 'Missing question (q) or response (r) query parameters' });
  }

  if (!simData[q]) {
    simData[q] = [r];
  } else {
    simData[q].push(r);
  }

  fs.writeFileSync(simPath, JSON.stringify(simData, null, 2));

  res.json({ message: `Taught "${q}" with response "${r}"` });
});

// Simulate endpoint
app.get('/sim', (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Missing question (q) query parameter' });
  }

  let highestMatch = '';
  let highestCount = 0;

  // Find the highest match based on the number of matching words
  Object.keys(simData).forEach(question => {
    const count = countMatchingWords(q, question);
    if (count > highestCount) {
      highestCount = count;
      highestMatch = question;
    }
  });

  // If there's no exact match, try to find a partial match
  if (highestCount === 0) {
    Object.keys(simData).forEach(question => {
      if (q.includes(question) && question.length > highestMatch.length) {
        highestCount = question.length;
        highestMatch = question;
      }
    });
  }

  const response = highestMatch ? getRandomResponse(simData[highestMatch]) : "I don't know what you're saying. Please teach me.";

  res.json({ question: q, response });
});

// Function to count matching words
function countMatchingWords(str1, str2) {
  const words1 = str1.toLowerCase().split(' ');
  const words2 = str2.toLowerCase().split(' ');

  const commonWords = words1.filter(word => words2.includes(word));

  return commonWords.length;
}

// Function to get a random response from an array of responses
function getRandomResponse(responses) {
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}

// Define the port to run the server on
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});