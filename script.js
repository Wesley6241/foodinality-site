// 初始化选项记录（存在 localStorage）
let selectedOptions = JSON.parse(localStorage.getItem("selectedOptions") || "[]");

// 用户点击选项时调用：记录 question_id + option_id，并跳转
function selectOption(questionId, optionId, goToPage) {
  selectedOptions.push({ question_id: questionId, option_id: optionId });
  localStorage.setItem("selectedOptions", JSON.stringify(selectedOptions));
  window.location.href = goToPage;
}

// 结果页加载后：计算得分，展示结果
async function generateResult() {
  const response = await fetch("score_data.json");
  const data = await response.json();

  const options = JSON.parse(localStorage.getItem("selectedOptions") || "[]");

  let cycleScore = { before: 0, during: 0, after: 0 };
  let focusScore = { desire: 0, routine: 0, ethos: 0 };
  let resourceMultiplier = 1, energyMultiplier = 1, wasteMultiplier = 1;


  options.forEach(({ option_id }) => {
    const c = Object.values(data.cycle_scores).find(o => o.option_id === option_id);
    if (c) {
      cycleScore.before += c.before_score || 0;
      cycleScore.during += c.during_score || 0;
      cycleScore.after += c.after_score || 0;
    }

    const f = Object.values(data.focus_scores).find(o => o.option_id === option_id);
    if (f) {
      focusScore.desire += f.desire_score || 0;
      focusScore.routine += f.routine_score || 0;
      focusScore.ethos += f.ethos_score || 0;
      if (f.cycle === getTopKey(cycleScore)) {
        focusScore.desire += (f.desire_score || 0) * 0.2;
        focusScore.routine += (f.routine_score || 0) * 0.2;
        focusScore.ethos += (f.ethos_score || 0) * 0.2;
      }
    }

    resourceMultiplier *= data.multipliers.resource[option_id] || 1;
    energyMultiplier *= data.multipliers.energy[option_id] || 1;
    wasteMultiplier *= data.multipliers.waste[option_id] || 1;
  });

    const BASE_RESOURCE = 63;
  const BASE_ENERGY = 5.6;
  const BASE_WASTE = 4.5;

  const resource = BASE_RESOURCE * resourceMultiplier;
  const energy = BASE_ENERGY * energyMultiplier;
  const waste = BASE_WASTE * wasteMultiplier;

  const resourceDiffAvg = BASE_RESOURCE * (resourceMultiplier - 1);
  const energyDiffAvg = BASE_ENERGY * (energyMultiplier - 1);
  const wasteDiffAvg = BASE_WASTE * (wasteMultiplier - 1);

  const topCycle = getTopKey(cycleScore);
  const topFocus = getTopKey(focusScore);
  const foodi = data.fooditype[topCycle.charAt(0).toUpperCase() + topCycle.slice(1)][topFocus];
  const edible = data.edible[topCycle.charAt(0).toUpperCase() + topCycle.slice(1)][topFocus];

  document.getElementById("fooditype").innerText = `Your fooditype is: ${foodi}`;
  document.getElementById("signaturefood").innerText = `Your signature food is: ${edible}`;
  // Load and display behavior description
  const behaviorResponse = await fetch("foodi_behavior.json");
  const behaviorData = await behaviorResponse.json();
  const behaviorText = behaviorData[topCycle.charAt(0).toUpperCase() + topCycle.slice(1)][topFocus];
  document.getElementById("behavior").innerText = behaviorText;

  document.getElementById("resource").innerText =
  `Every week, you consume $${resource.toFixed(2)} in food-related resources, ` +
  (Math.abs(resourceDiffAvg) < 0.01
    ? `which is about the average in the US.`
    : `which is ${Math.abs(resourceDiffAvg).toFixed(2)} dollars ${resourceDiffAvg > 0 ? "above" : "below"} the average.`);

document.getElementById("energy").innerText =
  `Every week, you use ${energy.toFixed(2)} kWh energy for foraging, preparing food, and processing food waste` +
  (Math.abs(energyDiffAvg) < 0.01
    ? `which is about the average in the US.`
    : `which is ${Math.abs(energyDiffAvg).toFixed(2)} kWh ${energyDiffAvg > 0 ? "above" : "below"} the average.`);

document.getElementById("waste").innerText =
  `Every week, you generate ${waste.toFixed(2)} lbs of food waste, ` +
  (Math.abs(wasteDiffAvg) < 0.01
    ? `which is about the average in the US.`
    : `which is ${Math.abs(wasteDiffAvg).toFixed(2)} lbs ${wasteDiffAvg > 0 ? "above" : "below"} the average.`);
  
    const missedResponse = await fetch("foodi_missed.json");
    const missedData = await missedResponse.json();
    const missed = missedData[topCycle.charAt(0).toUpperCase() + topCycle.slice(1)][topFocus];
    document.getElementById("missed-title").innerText = "What You Might Have Missed";
    document.getElementById("missed-content").innerText = missed.missed;
    const tryusResponse = await fetch("foodi_tryus.json");
    const tryusData = await tryusResponse.json();
    const tryus = tryusData[topCycle.charAt(0).toUpperCase() + topCycle.slice(1)][topFocus];
    document.getElementById("tryus-title").innerText = tryus.title;
    document.getElementById("tryus-content").innerText = tryus.text;

    
  // 清除记录（防止下次打开还带着）
  // localStorage.removeItem("selectedOptions");
}

function getTopKey(obj) {
  return Object.entries(obj).reduce((a, b) => b[1] > a[1] ? b : a)[0];
}

// 自动绑定所有 .option 的点击事件
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".option").forEach(btn => {
    const optionId = btn.dataset.optionId;
    const goTo = btn.dataset.goto;
    const questionId = btn.closest(".options")?.previousElementSibling?.dataset.questionId;

    if (optionId && questionId) {
      // 只有有 question_id 的才是问卷题 → 绑定为选项
      btn.addEventListener("click", () => {
        const optionsWrapper = btn.closest(".options");

        // 单选逻辑：取消同题其他选项的 .selected
        optionsWrapper.querySelectorAll(".option").forEach(el => el.classList.remove("selected"));
        btn.classList.add("selected");

        const selectedOptions = JSON.parse(localStorage.getItem("selectedOptions") || "[]");
        selectedOptions.push({ question_id: questionId, option_id: optionId });
        localStorage.setItem("selectedOptions", JSON.stringify(selectedOptions));

        if (goTo) {
          setTimeout(() => window.location.href = goTo, 200);
        }
      });
    }
  });
});

  
  function restartTest() {
    localStorage.removeItem("selectedOptions");
    window.location.href = "index.html";
  }
  
  function submitToAirtable() {
    const fooditype = document.getElementById("fooditype").innerText;
    const signaturefood = document.getElementById("signaturefood").innerText;
    const resource = document.getElementById("resource").innerText.match(/[\d.]+/)[0];
    const energy = document.getElementById("energy").innerText.match(/[\d.]+/)[0];
    const waste = document.getElementById("waste").innerText.match(/[\d.]+/)[0];
  
    const selectedOptions = JSON.parse(localStorage.getItem("selectedOptions") || "[]");
    const formattedSelections = selectedOptions.map(obj => `${obj.question_id}:${obj.option_id}`).join("\n");
  
    fetch("https://api.airtable.com/v0/appF58bJRuDmOJAL2/Submissions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer patsDoFPDCRNPYes6.838d4e13ee544156b6c32f2d9014601862c6588ddea331bd3985818de87905ca",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fields: {
          "Fooditype": fooditype,
          "Signature Food": signaturefood,
          "Resource": resource,
          "Energy": energy,
          "Waste": waste,
          "Timestamp": new Date().toISOString(),
          "Selected Options": formattedSelections
        }
      })
    })
    .then(res => res.json())
    .then(data => {
      alert("🎉 Submitted to Airtable!");
      restartTest(); // 提交完跳回首页
    })
    .catch(err => {
      console.error("Airtable submit error:", err);
      alert("❌ Submit failed.");
    });
  }
  
  
  function restartTest() {
    localStorage.removeItem("selectedOptions"); // ✅ 正确的位置！
    window.location.href = "index.html";
  }  
  
  