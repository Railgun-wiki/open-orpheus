<script lang="ts">
  import type { Attachment } from "svelte/attachments";
  import { onMount } from "svelte";

  import { getBridge } from "$lib/bridge";

  import type {
    MiniPlayerContract,
    MiniPlayerFullState,
    MiniPlayerPlayInfo,
    MiniPlayerPlayState,
    MiniPlayerListData,
  } from "$bridge/contracts/mini-player-api";

  const api = getBridge<MiniPlayerContract>("miniPlayer");

  let playInfo = $state<MiniPlayerPlayInfo | null>(null);
  let coverUrl = $state<string | null>(null);
  let likeMark = $state(false);
  let playState = $state<MiniPlayerPlayState>({ playing: false });
  let listData = $state<MiniPlayerListData>({ items: [], currentPlay: null });

  function applyFullState(state: MiniPlayerFullState) {
    playInfo = state.playInfo;
    coverUrl = state.coverUrl;
    likeMark = state.likeMark;
    playState = state.playState;
    listData = { items: state.listItems, currentPlay: state.currentPlay };
  }

  onMount(async () => {
    api.events.playInfoUpdate((info) => {
      playInfo = info;
    });
    api.events.coverUpdate((url) => {
      coverUrl = url;
    });
    api.events.likeUpdate((liked) => {
      likeMark = liked;
    });
    api.events.playStateUpdate((state) => {
      playState = state;
    });
    api.events.listUpdate((data) => {
      listData = data;
    });
    api.events.fullStateUpdate(applyFullState);

    const state = await api.requestFullUpdate();
    if (state) {
      applyFullState(state);
    }
  });

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
>
  {#if playInfo}
    <div class="flex h-full items-center gap-2 px-2 text-xs">
      {#if coverUrl}
        <img src={coverUrl} alt="" class="h-8 w-8 rounded object-cover" />
      {/if}
      {#if likeMark}
        <p>Liked</p>
      {/if}
      {#if playState.playing}
        <p>Playing</p>
      {/if}
      <span class="truncate">{playInfo.songName}</span>
      <span class="truncate text-gray-500">{playInfo.artistName}</span>
    </div>
  {/if}
</div>
<div class="h-85" {@attach showList && inputRegionAttachment}>
  {#if listData.items.length > 0}
    <ul class="p-2 text-xs">
      {#each listData.items as item (item.id)}
        <li class:font-bold={item.id === listData.currentPlay}>
          {item.title} - {item.artist}
        </li>
      {/each}
    </ul>
  {/if}
</div>
