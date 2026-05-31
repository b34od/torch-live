"use client";

import { useEffect } from "react";

export default function ScheduleViewTabs() {
  useEffect(() => {
    function handleClick(event) {
      const tab = event.target.closest("[data-view]");
      if (!tab || !tab.classList.contains("schedule-view-tab")) return;
      const view = tab.getAttribute("data-view");
      const container = tab.closest("section") || document;
      container.querySelectorAll(".schedule-view-tab").forEach((t) => {
        t.classList.toggle("active", t.getAttribute("data-view") === view);
      });
      container.querySelectorAll(".schedule-view-panel").forEach((panel) => {
        panel.hidden = panel.getAttribute("data-view") !== view;
      });
    }
    document.addEventListener("click", handleClick);
    const defaultTab = document.querySelector('.schedule-view-tab[data-default="true"]');
    if (defaultTab) defaultTab.classList.add("active");
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
