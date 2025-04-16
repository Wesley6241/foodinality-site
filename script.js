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
  let resource = 0, energy = 0, waste = 0;

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

    resource += data.multipliers.resource[option_id] || 1;
    energy += data.multipliers.energy[option_id] || 1;
    waste += data.multipliers.waste[option_id] || 1;
  });

  const topCycle = getTopKey(cycleScore);
  const topFocus = getTopKey(focusScore);
  const foodi = data.fooditype[topCycle.charAt(0).toUpperCase() + topCycle.slice(1)][topFocus];
  const edible = data.edible[topCycle.charAt(0).toUpperCase() + topCycle.slice(1)][topFocus];

  document.getElementById("fooditype").innerText = `Your fooditype is: ${foodi}`;
  document.getElementById("signaturefood").innerText = `Your signature food is: ${edible}`;
  document.getElementById("resource").innerText = `Every week, you consume ${resource.toFixed(2)} resources`;
  document.getElementById("energy").innerText = `Every week, you consume ${energy.toFixed(2)} energy`;
  document.getElementById("waste").innerText = `Every week, you generate ${waste.toFixed(2)} waste`;

  // 清除记录（防止下次打开还带着）
  localStorage.removeItem("selectedOptions");
}

function getTopKey(obj) {
  return Object.entries(obj).reduce((a, b) => b[1] > a[1] ? b : a)[0];
}

// 自动绑定所有 .option 的点击事件
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".option").forEach(btn => {
      btn.addEventListener("click", () => {
        const optionId = btn.dataset.optionId;
        const optionsWrapper = btn.closest(".options");
        const questionId = optionsWrapper?.previousElementSibling?.dataset.questionId;
        const goTo = btn.dataset.goto;
  
        if (!questionId || !optionId) return;
  
        // 单选逻辑：当前题内所有 .option 取消选中
        optionsWrapper.querySelectorAll(".option").forEach(el => el.classList.remove("selected"));
        btn.classList.add("selected");
  
        // 保存选项
        const selectedOptions = JSON.parse(localStorage.getItem("selectedOptions") || "[]");
        selectedOptions.push({ question_id: questionId, option_id: optionId });
        localStorage.setItem("selectedOptions", JSON.stringify(selectedOptions));
  
        // 如设置了跳转，延迟跳转
        if (goTo) {
          setTimeout(() => window.location.href = goTo, 200);
        }
      });
    });
  });
  
  