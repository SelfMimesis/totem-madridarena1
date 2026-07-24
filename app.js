(() => {
  "use strict";

  const DESIGN_WIDTH = 2160;
  const DESIGN_HEIGHT = 3840;
  const stage = document.querySelector("#stage");
  const terminal = document.querySelector("#terminal");
  const mainVideo = document.querySelector("#mainVideo");
  const videoTrigger = document.querySelector("#videoTrigger");
  const signalModal = document.querySelector("#signalModal");
  const modalClose = document.querySelector("#modalClose");
  const leftSlider = document.querySelector("#leftSlider");
  const sliderNodes = [...document.querySelectorAll(".svg-hotspot--left")];
  const actionButtons = [...document.querySelectorAll(".svg-hotspot--right")];
  const utilityButtons = [...document.querySelectorAll(".svg-hotspot--utility")];
  const indicatorButton = document.querySelector(".svg-hotspot--indicator");
  const buttonFxLayer = document.querySelector("#buttonFxLayer");
  const svgButtonsArt = document.querySelector(".svg-controls__art");
  const notificationZone = document.querySelector("#notificationZone");
  const notificationEyebrow = document.querySelector("#notificationEyebrow");
  const notificationTitle = document.querySelector("#notificationTitle");
  const notificationMessage = document.querySelector("#notificationMessage");
  const notificationCode = document.querySelector("#notificationCode");
  const mapMarker = document.querySelector("#mapMarker");
  const mapMarkerLabel = document.querySelector("#mapMarkerLabel");
  const mapRoute = document.querySelector("#mapRoute");
  const fullscreenHotspot = document.querySelector("#fullscreenHotspot");
  const toast = document.querySelector("#toast");
  const toastText = document.querySelector("#toastText");

  let activeNode = 0;
  let draggingSlider = false;
  let toastTimer = 0;
  let lastFullscreenTap = 0;
  let fullscreenRequest = null;
  let lastFocusedElement = null;
  let notificationTimer = 0;
  let artReactionTimer = 0;
  let markerTimers = [];
  let markerPosition = { x: 50, y: 55 };
  const lastButtonAnimation = new WeakMap();

  const actionNotifications = {
    SYSTEM: ["SYSTEM // CORE", "CORE AWAKENED", "Secuencia lumínica del núcleo activada."],
    VECTOR: ["NAV // VECTOR", "VECTOR ACQUIRED", "Trayectoria principal fijada y sincronizada."],
    ZENITH: ["NAV // ZENITH", "ZENITH LOCKED", "Coordenadas superiores verificadas."],
    JUNCTION: ["NAV // JUNCTION", "JUNCTION OPEN", "Intersección de tránsito preparada."],
    RELAY: ["COMMS // RELAY", "RELAY ENGAGED", "Canal de retransmisión enlazado."],
    LIFELINE: ["SYSTEM // LIFELINE", "LIFELINE STABLE", "Reserva vital dentro de parámetros."],
    ARCHIVE: ["DATA // ARCHIVE", "ARCHIVE UNSEALED", "Registro histórico disponible para consulta."],
    TRANSROLL: ["TRANSIT // ROLL", "TRANSROLL READY", "Matriz de embarque preparada."],
  };

  const markerPositions = {
    SYSTEM: { x: 50, y: 13 },
    VECTOR: { x: 76, y: 21 },
    ZENITH: { x: 64, y: 33 },
    JUNCTION: { x: 79, y: 48 },
    RELAY: { x: 59, y: 61 },
    LIFELINE: { x: 73, y: 79 },
    ARCHIVE: { x: 31, y: 79 },
    TRANSROLL: { x: 49, y: 88 },
    "NODO 01": { x: 24, y: 18 },
    "NODO 02": { x: 39, y: 25 },
    "NODO 03": { x: 58, y: 19 },
    "NODO 04": { x: 73, y: 31 },
    "NODO 05": { x: 63, y: 44 },
    "NODO 06": { x: 43, y: 39 },
    "NODO 07": { x: 27, y: 53 },
    "NODO 08": { x: 46, y: 64 },
    "NODO 09": { x: 69, y: 69 },
    "NODO 10": { x: 52, y: 84 },
  };

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

  function hideControlNotification() {
    window.clearTimeout(notificationTimer);
    notificationZone.classList.remove("is-visible");
    notificationZone.setAttribute("aria-hidden", "true");
  }

  function getControlName(button) {
    return button.dataset.action || button.dataset.utility || button.dataset.label || "SYSTEM";
  }

  function drawMapRoute(from, to) {
    const deltaX = ((to.x - from.x) / 100) * notificationZone.clientWidth;
    const deltaY = ((to.y - from.y) / 100) * notificationZone.clientHeight;
    const distance = Math.hypot(deltaX, deltaY);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    mapRoute.style.left = `${from.x}%`;
    mapRoute.style.top = `${from.y}%`;
    mapRoute.style.width = `${distance}px`;
    mapRoute.style.transform = `rotate(${angle}deg)`;
    mapRoute.classList.remove("is-drawing");
    void mapRoute.offsetWidth;
    mapRoute.classList.add("is-drawing");
  }

  function moveMapMarker(button) {
    const controlName = getControlName(button);
    const target = markerPositions[controlName] || markerPositions.SYSTEM;
    const direction = target.x >= markerPosition.x ? 1 : -1;
    const midpoint = {
      x: Math.max(8, Math.min(92, (markerPosition.x + target.x) / 2 + direction * 4)),
      y: Math.max(8, Math.min(92, (markerPosition.y + target.y) / 2 - 6)),
    };

    markerTimers.forEach((timer) => window.clearTimeout(timer));
    markerTimers = [];
    drawMapRoute(markerPosition, target);
    mapMarkerLabel.textContent = controlName.replace("NODO ", "N-");
    mapMarker.classList.remove("is-arriving");
    mapMarker.classList.add("is-moving");

    requestAnimationFrame(() => {
      mapMarker.style.left = `${midpoint.x}%`;
      mapMarker.style.top = `${midpoint.y}%`;
    });

    markerTimers.push(
      window.setTimeout(() => {
        mapMarker.style.left = `${target.x}%`;
        mapMarker.style.top = `${target.y}%`;
      }, 530),
      window.setTimeout(() => {
        mapMarker.classList.remove("is-moving");
        mapMarker.classList.add("is-arriving");
      }, 1080),
      window.setTimeout(() => mapMarker.classList.remove("is-arriving"), 1880),
    );

    markerPosition = target;
  }

  function showControlNotification(button) {
    const controlName = getControlName(button);
    const content = button.dataset.label
      ? ["NODE // SELECT", `${button.dataset.label} LINKED`, "Canal táctil sincronizado con la red de navegación."]
      : actionNotifications[controlName] || ["SYSTEM // EVENT", "SIGNAL RECEIVED", "Comando aceptado por el terminal."];
    const sequence = String(Math.floor(performance.now() * 10)).padStart(6, "0").slice(-6);

    notificationEyebrow.textContent = content[0];
    notificationTitle.textContent = content[1];
    notificationMessage.textContent = content[2];
    notificationCode.textContent = `EZ // ${sequence} // ${controlName}`;

    window.clearTimeout(notificationTimer);
    notificationZone.classList.remove("is-visible");
    void notificationZone.offsetWidth;
    notificationZone.classList.add("is-visible");
    notificationZone.setAttribute("aria-hidden", "false");

    notificationTimer = window.setTimeout(hideControlNotification, 3200);
  }

  function emitButtonFx(button) {
    const buttonRect = button.getBoundingClientRect();
    const terminalRect = terminal.getBoundingClientRect();
    const terminalScale = terminalRect.width / terminal.offsetWidth;
    const centerX = (buttonRect.left + buttonRect.width / 2 - terminalRect.left) / terminalScale;
    const centerY = (buttonRect.top + buttonRect.height / 2 - terminalRect.top) / terminalScale;
    const burst = document.createElement("span");
    const flare = document.createElement("span");

    burst.className = "control-burst";
    burst.style.left = `${centerX}px`;
    burst.style.top = `${centerY}px`;
    buttonFxLayer.append(burst);

    flare.className = "control-flare";
    flare.style.left = `${centerX}px`;
    flare.style.top = `${centerY}px`;
    buttonFxLayer.append(flare);

    for (let index = 0; index < 18; index += 1) {
      const particle = document.createElement("i");
      const angle = index * 20 + (index % 2) * 7;
      const distance = 66 + (index % 5) * 20;

      particle.className = "control-particle";
      particle.style.left = `${centerX}px`;
      particle.style.top = `${centerY}px`;
      particle.style.setProperty("--particle-angle", `${angle}deg`);
      particle.style.setProperty("--particle-distance", `${distance}px`);
      particle.style.setProperty("--particle-delay", `${(index % 3) * 22}ms`);
      buttonFxLayer.append(particle);
      particle.addEventListener("animationend", () => particle.remove(), { once: true });
    }

    burst.addEventListener("animationend", () => burst.remove(), { once: true });
    flare.addEventListener("animationend", () => flare.remove(), { once: true });
  }

  function animateSvgButton(button) {
    if (!button) return;
    const now = performance.now();
    const previousAnimation = lastButtonAnimation.get(button);
    if (previousAnimation !== undefined && now - previousAnimation < 160) return;
    lastButtonAnimation.set(button, now);
    button.classList.remove("is-pressed");
    void button.offsetWidth;
    button.classList.add("is-pressed");
    emitButtonFx(button);
    moveMapMarker(button);
    showControlNotification(button);
    window.clearTimeout(artReactionTimer);
    svgButtonsArt.classList.remove("is-reacting");
    void svgButtonsArt.offsetWidth;
    svgButtonsArt.classList.add("is-reacting");
    artReactionTimer = window.setTimeout(() => svgButtonsArt.classList.remove("is-reacting"), 1000);
    window.setTimeout(() => button.classList.remove("is-pressed"), 920);
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
    const changed = next !== activeNode;
    if (changed) {
      pulseHaptic(9);
    }

    activeNode = next;
    sliderNodes.forEach((node, nodeIndex) => {
      const isActive = nodeIndex === activeNode;
      node.classList.toggle("is-active", isActive);
      node.setAttribute("aria-pressed", String(isActive));
    });

    updateSliderThumb(activeNode);
    if (changed || announce) {
      animateSvgButton(sliderNodes[activeNode]);
    }
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
    const previousNode = activeNode;
    draggingSlider = true;
    leftSlider.classList.add("is-dragging");
    leftSlider.setPointerCapture?.(event.pointerId);
    selectNodeFromPointer(event);
    if (previousNode === activeNode) {
      animateSvgButton(sliderNodes[activeNode]);
    }
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
    hideControlNotification();
    lastFocusedElement = document.activeElement;
    terminal.classList.add("is-obscured");
    signalModal.classList.add("is-open");
    signalModal.setAttribute("aria-hidden", "false");
    signalModal.inert = false;
    modalClose.focus({ preventScroll: true });
    pulseHaptic([18, 25, 18]);
    showToast("TRANSROLL SIGNAL // CONNECTED");
  }

  function closeSignalModal() {
    if (!signalModal.classList.contains("is-open")) return;
    signalModal.classList.remove("is-open");
    signalModal.setAttribute("aria-hidden", "true");
    signalModal.inert = true;
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
    animateSvgButton(button);
    pulseHaptic(11);
    showToast(`${button.dataset.action} // ACTIVE`);
  }

  function activateUtility(button) {
    const wasActive = button.classList.contains("is-active");
    utilityButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.toggle("is-active", !wasActive);
    animateSvgButton(button);
    pulseHaptic(10);
    showToast(`${button.dataset.utility} // ${wasActive ? "STANDBY" : "ENGAGED"}`);
  }

  function activateIndicator() {
    animateSvgButton(indicatorButton);
    pulseHaptic([12, 28, 12]);
    showToast("SYSTEM CORE // PULSE");
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

  function startPlayback() {
    const playMain = mainVideo.play();
    playMain?.catch?.(() => {});
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

  indicatorButton.addEventListener("click", (event) => {
    event.stopPropagation();
    activateIndicator();
  });

  leftSlider.addEventListener("pointerdown", startSliderDrag);
  leftSlider.addEventListener("pointermove", moveSlider);
  leftSlider.addEventListener("pointerup", endSliderDrag);
  leftSlider.addEventListener("pointercancel", endSliderDrag);
  videoTrigger.addEventListener("click", openSignalModal);
  modalClose.addEventListener("click", closeSignalModal);
  fullscreenHotspot.addEventListener("pointerup", handleFullscreenHotspot);
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
