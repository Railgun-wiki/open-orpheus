<script lang="ts">
  import type { Attachment } from "svelte/attachments";

  import { getBridge } from "$lib/bridge";

  import type { MiniPlayerContract } from "$bridge/contracts/mini-player-api";

  const api = getBridge<MiniPlayerContract>("miniPlayer");

  let inputRegionElements: Element[] = [];

  function refreshInputRegion() {
    if (api.platform === "linux") {
      api.setInputRegions(
        inputRegionElements.map((v) => {
          const bounding = v.getBoundingClientRect();
          return {
            x: bounding.left,
            y: bounding.top,
            width: bounding.width,
            height: bounding.height,
          };
        })
      );
    } else {
      // On Windows/macOS, `setIgnoreMouseEvent` is used instead of actual setting input regions
      for (const el of inputRegionElements) {
        if (el.matches(":hover")) {
          // Dummy region to disable input
          api.setInputRegions([{ x: 0, y: 0, width: 1, height: 1 }]);
          return;
        }
      }
      // Enable input
      api.setInputRegions([]);
    }
  }

  function addInputRegion(el: Element) {
    inputRegionElements.push(el);
    if (el instanceof HTMLElement) {
      el.addEventListener("mouseenter", refreshInputRegion);
      el.addEventListener("mouseleave", refreshInputRegion);
    }
    refreshInputRegion();
  }

  function removeInputRegion(el: Element) {
    inputRegionElements.splice(inputRegionElements.indexOf(el), 1);
    if (el instanceof HTMLElement) {
      el.removeEventListener("mouseenter", refreshInputRegion);
      el.removeEventListener("mouseleave", refreshInputRegion);
    }
    refreshInputRegion();
  }

  let showVolumeBar = $state(false);
  let showList = $state(false);

  const inputRegionAttachment: Attachment = (element) => {
    addInputRegion(element);
    return () => {
      removeInputRegion(element);
    };
  };
</script>

<div class="h-12" {@attach showVolumeBar && inputRegionAttachment}></div>
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="h-12.5 border border-gray-400 bg-white"
  onmousedown={() => api.dragWindow()}
  {@attach inputRegionAttachment}
></div>
<div class="h-85" {@attach showList && inputRegionAttachment}></div>
