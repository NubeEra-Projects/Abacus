// Rules (easy & realistic)
// Level ≤ 3 → only positive (1–9)
// Level ≥ 4 → mix of positive & small negatives
// Keeps numbers mental-math friendly
function generateNumbers(levels) {
  let nums = [];
  for (let i = 0; i < levels; i++) {
    let num;

    if (levels <= 3) {
      num = Math.floor(Math.random() * 9) + 1; // 1–9
    } else {
      num = Math.floor(Math.random() * 19) - 9; // -9 to 9
      if (num === 0) num = 1;
    }
    nums.push(num);
  }
  return nums;
}
////////////////////////////////////////////////////////
function shuffleArray(arr) {
  let array = [...arr];

  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
////////////////////////////////////////////////////////
// generateNumbers(3); // [4, 2, 9]
// generateNumbers(4); // [4, 2, 7, 9]
// generateNumbers(6); // [8, -3, 5, 6, -2, 4]
////////////////////////////////////////////////////////
function generateAbacusMCQ(numbers) {
  const correctAnswer = numbers.reduce((sum, n) => sum + n, 0);
  let options = new Set();
  while (options.size < 3) {
    let offset = Math.floor(Math.random() * 15) - 7; // -7 to +7
    let wrong = correctAnswer + offset;
    if (wrong !== correctAnswer) {
      options.add(wrong);
    }
  }
  let finalOptions = shuffleArray([...options, correctAnswer]);
  let correctIndex = finalOptions.indexOf(correctAnswer);
  return {
    options: finalOptions,
    correctIndex
  };
}
////////////////////////////////////////////////////////
let levels = 4;

let returnQuestions = generateNumbers(levels);
let mcq = generateAbacusMCQ(returnQuestions);

console.log("Question Numbers:", returnQuestions);
console.log("Options:", mcq.options);
console.log("Correct Option Index:", mcq.correctIndex);

////////////////////////////////////////////////////////
// Question Numbers: [4, 2, 7, 9]
// Options: [20, 25, 22, 18]
// Correct Option Index: 2 // 22
