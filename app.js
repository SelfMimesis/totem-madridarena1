(() => {
  "use strict";

  const DESIGN_WIDTH = 2160;
  const DESIGN_HEIGHT = 3840;
  const stage = document.querySelector("#stage");
  const terminal = document.querySelector("#terminal");
  const mainVideo = document.querySelector("#mainVideo");
  const backgroundVideo = document.querySelector("#backgroundVideo");
  const videoTrigger = document.querySelector("#videoTrigger");
  const signalModal = document.querySelector("#signalModal");
  const modalClose = document.querySelector("#modalClose");
  const leftSlider = document.querySelector("#leftSlider");
  const sliderNodes = [...document.querySelectorAll(".slider-node")];
  const actionButtons = [...document.querySelectorAll(".action-button")];
  const signalStrip = document.querySelector("#signalStrip");
  const utilityButtons = [...document.querySelectorAll(".utility-button")];
  const footerHotspot = document.querySelector("#footerHotspot");
  const fullscreenHotspot = document.querySelector("#fullscreenHotspot");
  const toast = document.querySelector("#toast");
  const toastText = document.querySelector("#toastText");

  let activeNode = 0;
  let draggingSlider = false;
  let toastTimer = 0;
  let lastFullscreenTap = 0;
  let fullscreenRequest = null;
  let lastFocusedElement = null;
  let signalMode = 0;

  const signalModes = [
    { label: "SIGNAL // CHANNEL 01", width: "71%" },
    { label: "SIGNAL // CHANNEL 04", width: "88%" },
    { label: "SIGNAL // DEEP SCAN", width: "96%" },
  ];

  function fitStage() {
    const scale = Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT);
    stage.style.setProperty("--stage-scale", scale.toFixed(6));
  }

  function showToast(message, duration = 1500) {
    window.clearTimeout(toastTimer);
    toastText.textContent = message;
    toast.classList.add("is-visible");
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
    }, duration);
  }

  function pulseHaptic(duration = 12) {
    if ("vibrate" in navigator) {
      navigator.vibrate(duration);
    }
  }

  function updateSliderThumb(index, animate = true) {
    const selected = sliderNodes[index];
    if (!selected) return;

    if (!animate) {
      leftSlider.classList.add("is-dragging");
    }

    const nodeCenter = selected.offsetTop + selected.offsetHeight / 2;
    const percentage = (nodeCenter / leftSlider.clientHeight) * 100;
    leftSlider.style.setProperty("--thumb-y", `${percentage}%`);

    if (!animate) {
      requestAnimationFrame(() => leftSlider.classList.remove("is-dragging"));
    }
  }

  function setActiveNode(index, announce = true) {
    const next = Math.max(0, Math.min(sliderNodes.length - 1, index));
    if (next !== activeNode) {
      pulseHaptic(9);
    }

    activeNode = next;
    sliderNodes.forEach((node, nodeIndex) => {
      const isActive = nodeIndex === activeNode;
      node.classList.toggle("is-active", isActive);
      node.setAttribute("aria-pressed", String(isActive));
    });

    updateSliderThumb(activeNode);
    if (announce) {
      showToast(`${sliderNodes[activeNode].dataset.label} // LOCKED`);
    }
  }

  function closestNodeFromPointer(clientY) {
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    sliderNodes.forEach((node, index) => {
      const rect = node.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const distance = Math.abs(clientY - center);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  function selectNodeFromPointer(event) {
    setActiveNode(closestNodeFromPointer(event.clientY), false);
  }

  function startSliderDrag(event) {
    if (event.button !== undefined && event.button !== 0) return;
    draggingSlider = true;
    leftSlider.classList.add("is-dragging");
    leftSlider.setPointerCapture?.(event.pointerId);
    selectNodeFromPointer(event);
    event.preventDefault();
  }

  function moveSlider(event) {
    if (!draggingSlider) return;
    selectNodeFromPointer(event);
    event.preventDefault();
  }

  function endSliderDrag(event) {
    if (!draggingSlider) return;
    draggingSlider = false;
    leftSlider.classList.remove("is-dragging");
    leftSlider.releasePointerCapture?.(event.pointerId);
    showToast(`${sliderNodes[activeNode].dataset.label} // LOCKED`);
    event.preventDefault();
  }

  function openSignalModal() {
    if (signalModal.classList.contains("is-open")) return;
    lastFocusedElement = document.activeElement;
    terminal.classList.add("is-obscured");
    signalModal.classList.add("is-open");
    signalModal.setAttribute("aria-hidden", "false");
    modalClose.focus({ preventScroll: true });
    pulseHaptic([18, 25, 18]);
    showToast("TRANSROLL SIGNAL // CONNECTED");
  }

  function closeSignalModal() {
    if (!signalModal.classList.contains("is-open")) return;
    signalModal.classList.remove("is-open");
    signalModal.setAttribute("aria-hidden", "true");
    terminal.classList.remove("is-obscured");
    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus({ preventScroll: true });
    }
    pulseHaptic(14);
  }

  function selectAction(button) {
    actionButtons.forEach((item) => {
      const isActive = item === button;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
    pulseHaptic(11);
    showToast(`${button.dataset.action} // ACTIVE`);
  }

  function cycleSignalMode() {
    signalMode = (signalMode + 1) % signalModes.length;
    const nextMode = signalModes[signalMode];
    signalStrip.querySelector(".signal-strip__text").textContent = nextMode.label;
    signalStrip.querySelector(".signal-strip__fill").style.width = nextMode.width;
    pulseHaptic(12);
    showToast(`${nextMode.label} // ONLINE`);
  }

  function activateUtility(button) {
    const wasActive = button.classList.contains("is-active");
    utilityButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.toggle("is-active", !wasActive);
    pulseHaptic(10);
    showToast(`${button.dataset.utility} // ${wasActive ? "STANDBY" : "ENGAGED"}`);
  }

  function toggleFooterDiagnostic() {
    const isActive = footerHotspot.classList.toggle("is-active");
    pulseHaptic(8);
    showToast(`LOWER DIAGNOSTIC // ${isActive ? "VISIBLE" : "HIDDEN"}`);
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function requestFullscreen() {
    const target = document.documentElement;
    try {
      if (target.requestFullscreen) {
        fullscreenRequest = target.requestFullscreen({ navigationUI: "hide" });
      } else if (target.webkitRequestFullscreen) {
        fullscreenRequest = target.webkitRequestFullscreen();
      }
    } catch {
      fullscreenRequest = null;
      showToast("FULLSCREEN // UNAVAILABLE");
    }

    if (fullscreenRequest?.catch) {
      fullscreenRequest.catch(() => showToast("FULLSCREEN // BLOCKED"));
    }
    return fullscreenRequest;
  }

  function exitFullscreen() {
    try {
      if (document.exitFullscreen) {
        return document.exitFullscreen();
      }
      if (document.webkitExitFullscreen) {
        return document.webkitExitFullscreen();
      }
    } catch {
      showToast("EXIT // UNAVAILABLE");
    }
    return null;
  }

  function handleFullscreenHotspot(event) {
    const now = performance.now();
    const isDoubleTap = now - lastFullscreenTap < 420;
    lastFullscreenTap = isDoubleTap ? 0 : now;

    if (isDoubleTap) {
      const exit = () => {
        if (fullscreenElement()) {
          exitFullscreen();
        }
      };

      if (fullscreenRequest?.finally) {
        fullscreenRequest.finally(exit);
      } else {
        exit();
      }
      pulseHaptic([15, 35, 15]);
      event.preventDefault();
      return;
    }

    if (!fullscreenElement()) {
      requestFullscreen();
      pulseHaptic(14);
    }
    event.preventDefault();
  }

  function keepVideosSynchronized() {
    if (Math.abs(backgroundVideo.currentTime - mainVideo.currentTime) > 0.18) {
      backgroundVideo.currentTime = mainVideo.currentTime;
    }
  }

  function startPlayback() {
    const playMain = mainVideo.play();
    const playBackground = backgroundVideo.play();
    playMain?.catch?.(() => {});
    playBackground?.catch?.(() => {});
  }

  function trapModalFocus(event) {
    if (event.key !== "Tab" || !signalModal.classList.contains("is-open")) return;
    event.preventDefault();
    modalClose.focus({ preventScroll: true });
  }

  sliderNodes.forEach((node, index) => {
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      setActiveNode(index);
    });

    node.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        const next = Math.min(sliderNodes.length - 1, index + 1);
        setActiveNode(next);
        sliderNodes[next].focus();
      }
      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        const previous = Math.max(0, index - 1);
        setActiveNode(previous);
        sliderNodes[previous].focus();
      }
    });
  });

  actionButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      selectAction(button);
    });
  });

  utilityButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      activateUtility(button);
    });
  });

  leftSlider.addEventListener("pointerdown", startSliderDrag);
  leftSlider.addEventListener("pointermove", moveSlider);
  leftSlider.addEventListener("pointerup", endSliderDrag);
  leftSlider.addEventListener("pointercancel", endSliderDrag);
  videoTrigger.addEventListener("click", openSignalModal);
  modalClose.addEventListener("click", closeSignalModal);
  signalStrip.addEventListener("click", cycleSignalMode);
  footerHotspot.addEventListener("click", toggleFooterDiagnostic);
  fullscreenHotspot.addEventListener("pointerup", handleFullscreenHotspot);
  mainVideo.addEventListener("timeupdate", keepVideosSynchronized);
  window.addEventListener("resize", fitStage, { passive: true });

  document.addEventListener("fullscreenchange", () => {
    showToast(fullscreenElement() ? "FULLSCREEN // ACTIVE" : "FULLSCREEN // EXIT");
  });
  document.addEventListener("webkitfullscreenchange", () => {
    showToast(fullscreenElement() ? "FULLSCREEN // ACTIVE" : "FULLSCREEN // EXIT");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSignalModal();
    }
    if (event.key.toLowerCase() === "f" && !signalModal.classList.contains("is-open")) {
      if (fullscreenElement()) {
        exitFullscreen();
      } else {
        requestFullscreen();
      }
    }
    trapModalFocus(event);
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) startPlayback();
  });

  fitStage();
  startPlayback();
  requestAnimationFrame(() => updateSliderThumb(activeNode, false));
})();
