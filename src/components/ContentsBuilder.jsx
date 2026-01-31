import React, { useEffect, useRef } from 'react';
import { initContentsBuilder } from './ContentsBuilderLogic.js';
import './ContentsBuilder.css';

const htmlContent = `
    <div id="home-screen">
      <canvas id="home-canvas-background"></canvas>
       <header class="home-header">
        <div class="logo">ktds Contents Builder</div>
        <nav class="home-nav">
          <a href="#" id="nav-icon-builder">Icon Builder</a>
          <a href="#" id="nav-image-builder">Image Builder</a>
          <a href="#" id="nav-video-builder">Video Builder</a>
        </nav>
      </header>
      <main class="home-main">
          <h1 class="home-title">ktds Contents Builder</h1>
          <div class="home-prompt-container">
            <textarea id="home-prompt-input" placeholder="What do you want to create?" rows="1"></textarea>
            <button id="home-run-btn" aria-label="Submit prompt">
                <span class="material-symbols-outlined">arrow_upward</span>
            </button>
        </div>
      </main>
    </div>

    <div id="icon-builder-screen" class="hidden">
      <main id="main-content" class="main-content">
        <header class="main-header">
           <button id="back-to-home-btn" class="icon-button" aria-label="Back to home">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 id="builder-title">Icon Builder</h1>
          <div class="search-container">
            <span class="material-symbols-outlined search-icon">search</span>
            <input type="search" id="search-input" placeholder="Search icons" />
          </div>
          <div class="header-right">
            <div class="sort-dropdown">
              <label for="sort-by">Sort by</label>
              <select id="sort-by">
                <option>Most popular</option>
              </select>
            </div>
            <button
              class="theme-toggle-btn icon-button"
              aria-label="테마 전환"
            >
              <span class="material-symbols-outlined">light_mode</span>
            </button>
          </div>
        </header>

        <section class="info-cards">
          <div class="info-card">
            <div>
              <h3>Material Design icon guidelines</h3>
              <p>Learn about the latest best practices for icons</p>
            </div>
            <span class="material-symbols-outlined card-icon"
              >design_services</span
            >
          </div>
          <div class="info-card">
            <div>
              <h3>Figma plugin</h3>
              <p>Use the Material Symbols plugin on Figma</p>
            </div>
            <span class="material-symbols-outlined card-icon">hub</span>
          </div>
          <div class="info-card">
            <div>
              <h3>GitHub repo</h3>
              <p>This repository contains the binary font file</p>
            </div>
            <span class="material-symbols-outlined card-icon"
              >arrow_outward</span
            >
          </div>
        </section>

        <div id="icon-grid-container">
          <div id="icon-grid"></div>
        </div>
      </main>

      <aside id="inspector-panel" class="right-panel">
        <header class="inspector-header">
          <div class="inspector-title">
            <span class="material-symbols-outlined header-icon"
              >auto_awesome</span
            >
            <h2>AI Studio</h2>
          </div>
          <button
            id="inspector-close-btn"
            class="icon-button"
            aria-label="Close"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>

        <nav class="inspector-tabs">
          <button
            class="tab-item active"
            role="tab"
            aria-selected="true"
            data-tab="generate"
          >
            Generate 3D
          </button>
          <button class="tab-item" role="tab" data-tab="customize">
            Customize
          </button>
          <button class="tab-item" role="tab" data-tab="code">
            Code
          </button>
        </nav>

        <div class="inspector-body">
          <!-- Generate 3D Tab -->
          <div
            id="tab-content-generate"
            class="tab-content"
            data-tab-content="generate"
          >
            <div class="inspector-section">
              <h3>3D Preview</h3>
              <div class="preview-box" id="preview-box-3d">
                <div class="preview-tabs-container">
                  <button
                    id="image-tab-btn"
                    class="preview-tab-btn active"
                    role="tab"
                  >
                    Image
                  </button>
                  <button
                    id="video-tab-btn"
                    class="preview-tab-btn"
                    role="tab"
                    disabled
                  >
                    Video
                  </button>
                </div>
                <div class="preview-content-container">
                  <div
                    id="image-tab-content"
                    class="preview-tab-content active"
                    role="tabpanel"
                  >
                    <img
                      id="generated-image"
                      alt="Generated 3D Icon Preview"
                    />
                  </div>
                  <div
                    id="video-tab-content"
                    class="preview-tab-content"
                    role="tabpanel"
                  >
                    <video
                      id="generated-video"
                      loop
                      autoplay
                      muted
                      playsinline
                    ></video>
                  </div>
                </div>
                <div class="loader" id="loader"></div>
                <p id="error-message"></p>
              </div>
            </div>
            <div class="inspector-section">
              <h3>Animation (for Video)</h3>
              <div class="animation-preview-controls">
                <div class="control-group">
                  <label for="animation-type-select">유형</label>
                  <select id="animation-type-select">
                    <option value="none">없음</option>
                    <option value="bounce">바운스</option>
                    <option value="pulse" selected>펄스</option>
                    <option value="spin">회전</option>
                  </select>
                </div>
                <div class="control-group">
                  <label for="animation-speed-select">속도</label>
                  <select id="animation-speed-select">
                    <option value="slow">느리게</option>
                    <option value="normal" selected>보통</option>
                    <option value="fast">빠르게</option>
                  </select>
                </div>
                <button id="play-3d-animation-btn" class="play-button">
                  <span class="material-symbols-outlined">play_arrow</span>
                </button>
              </div>
            </div>
            <div class="inspector-section">
              <h3>Style Reference (Creon 3D)</h3>
              <div class="reference-images-container">
                <img src="/src/assets/reference/reference_1.png" alt="Ref 1" class="ref-img selected" />
                <img src="/src/assets/reference/reference_2.png" alt="Ref 2" class="ref-img" />
                <img src="/src/assets/reference/reference_3.png" alt="Ref 3" class="ref-img" />
              </div>
            </div>

            <div class="inspector-section">
              <h3>Base System Prompt</h3>
              <div class="base-prompt-container">
                <textarea id="base-system-prompt" rows="10" readonly></textarea>
                <div class="nano-controls" style="margin-top: 12px; display: flex; flex-direction: column; gap: 8px;">
                    <button id="btn-generate-nanobanana" class="primary-btn" style="background: linear-gradient(135deg, #FFD700, #FFAA00); color: #000; font-weight: bold;">
                        <span class="material-symbols-outlined">auto_awesome</span>
                        Generate with NanoBanana
                    </button>
                    <div id="nano-result-container" style="min-height: 200px; background: #f5f5f5; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
                        <div class="placeholder-text" style="color: #999; font-size: 12px;">Result will appear here</div>
                        <img id="nano-generated-image" style="width: 100%; height: auto; display: none;" />
                        <div class="loader" id="nano-loader" style="display: none;"></div>
                    </div>
                </div>
              </div>
            </div>
            <div class="inspector-section">
              <h3>Prompt</h3>
              <textarea id="prompt-input" rows="4"></textarea>
              <div style="margin-top: 16px">
                <h3 style="margin-bottom: 8px">Negative Prompt</h3>
                <textarea
                  id="negative-prompt-input"
                  rows="3"
                  placeholder="Enter things to avoid in the image, e.g., 'text, watermark, ugly, deformed'"
                ></textarea>
              </div>
              <div class="button-group">
                <button id="regenerate-btn" class="primary-btn">
                  Regenerate
                </button>
                <div class="button-group-secondary">
                  <button id="download-btn" class="secondary-btn" disabled>
                    Download
                  </button>
                  <button
                    id="convert-to-video-btn"
                    class="secondary-btn"
                    disabled
                  >
                    Make Video
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Customize Tab -->
          <div
            id="tab-content-customize"
            class="tab-content hidden"
            data-tab-content="customize"
          >
            <div class="inspector-section">
              <h3>2D Style</h3>
              <div class="filter-controls">
                <div class="control-row">
                  <div class="control-label">
                    <label for="fill-toggle">Fill</label>
                    <span
                      class="material-symbols-outlined info-icon"
                      title="Toggle between filled and outlined icon style."
                      >info</span
                    >
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" id="fill-toggle" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>

                <div class="control-row-slider">
                  <div class="control-label">
                    <label for="weight-slider">Weight</label>
                    <span
                      class="material-symbols-outlined info-icon"
                      title="Adjust the stroke weight of the icon."
                      >info</span
                    >
                  </div>
                  <input
                    type="range"
                    id="weight-slider"
                    min="100"
                    max="700"
                    value="400"
                    step="100"
                  />
                  <div class="slider-labels">
                    <span>Light</span>
                    <span>Bold</span>
                  </div>
                </div>

                <div class="control-row-slider">
                  <div class="control-label">
                    <label for="grade-slider">Grade</label>
                    <span
                      class="material-symbols-outlined info-icon"
                      title="Adjust the symbol's thickness for emphasis."
                      >info</span
                    >
                  </div>
                  <input
                    type="range"
                    id="grade-slider"
                    min="-25"
                    max="200"
                    value="0"
                    step="1"
                  />
                  <div class="slider-labels">
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>

                <div class="control-row-slider">
                  <div class="control-label">
                    <label for="optical-size-slider">Optical Size</label>
                    <span
                      class="material-symbols-outlined info-icon"
                      title="Adjust the icon size for optimal legibility."
                      >info</span
                    >
                  </div>
                  <input
                    type="range"
                    id="optical-size-slider"
                    min="20"
                    max="48"
                    value="24"
                    step="1"
                  />
                  <div class="slider-labels">
                    <span>20px</span>
                    <span>48px</span>
                  </div>
                </div>

                <hr class="divider" />

                <fieldset class="style-group">
                  <legend>Family</legend>
                  <div class="chip-group">
                    <input
                      type="radio"
                      id="style-outlined"
                      name="icon-family"
                      value="Outlined"
                      checked
                    />
                    <label for="style-outlined">Outlined</label>
                    <input
                      type="radio"
                      id="style-rounded"
                      name="icon-family"
                      value="Rounded"
                    />
                    <label for="style-rounded">Rounded</label>
                    <input
                      type="radio"
                      id="style-sharp"
                      name="icon-family"
                      value="Sharp"
                    />
                    <label for="style-sharp">Sharp</label>
                  </div>
                </fieldset>
              </div>
            </div>
          </div>

          <!-- Code Tab -->
          <div
            id="tab-content-code"
            class="tab-content hidden"
            data-tab-content="code"
          >
            <div class="inspector-section">
              <h3>2D Icon Snippets</h3>
              <div class="code-snippet-container">
                <p class="snippet-title">HTML</p>
                <div class="code-box">
                  <pre><code id="snippet-html-code"></code></pre>
                  <button
                    id="copy-html-btn"
                    class="icon-button copy-button"
                    aria-label="Copy HTML code"
                  >
                    <span class="material-symbols-outlined">content_copy</span>
                  </button>
                </div>
              </div>
              <div class="code-snippet-container">
                <p class="snippet-title">CSS</p>
                <div class="code-box">
                  <pre><code id="snippet-css-code"></code></pre>
                  <button
                    id="copy-css-btn"
                    class="icon-button copy-button"
                    aria-label="Copy CSS code"
                  >
                    <span class="material-symbols-outlined">content_copy</span>
                  </button>
                </div>
              </div>
            </div>
            <div
              id="code-snippet-3d-section"
              class="inspector-section hidden"
            >
              <h3>3D Image Snippet</h3>
              <div class="code-box">
                <pre><code id="snippet-3d-code"></code></pre>
                <button
                  id="copy-3d-btn"
                  class="icon-button copy-button"
                  aria-label="Copy HTML code"
                >
                  <span class="material-symbols-outlined">content_copy</span>
                </button>
              </div>
            </div>
            <div
              id="code-snippet-anim-section"
              class="inspector-section hidden"
            >
              <h3>2D Animation</h3>
              <div class="preview-box" id="preview-box-animation"></div>
              <div class="animation-preview-controls" style="margin-top: 16px">
                <div class="control-group">
                  <label for="preview-animation-type">Animation</label>
                  <select id="preview-animation-type">
                    <option value="">None</option>
                    <option value="bounce">Bounce</option>
                    <option value="pulse">Pulse</option>
                    <option value="spin">Spin</option>
                  </select>
                </div>
                <div class="control-group">
                  <label for="preview-animation-repeat">Repeat</label>
                  <select id="preview-animation-repeat">
                    <option value="1">Once</option>
                    <option value="infinite">Infinite</option>
                  </select>
                </div>
                <button id="play-animation-btn" class="play-button">
                  <span class="material-symbols-outlined">play_arrow</span>
                </button>
              </div>
              <div class="code-snippet-container" style="margin-top: 16px">
                <p class="snippet-title">Keyframes CSS</p>
                <div class="code-box">
                  <pre><code id="snippet-anim-keyframes-code"></code></pre>
                  <button
                    id="copy-anim-keyframes-btn"
                    class="icon-button copy-button"
                    aria-label="Copy keyframes CSS"
                  >
                    <span class="material-symbols-outlined">content_copy</span>
                  </button>
                </div>
              </div>
              <div class="code-snippet-container">
                <p class="snippet-title">Class CSS</p>
                <div class="code-box">
                  <pre><code id="snippet-anim-class-code"></code></pre>
                  <button
                    id="copy-anim-class-btn"
                    class="icon-button copy-button"
                    aria-label="Copy class CSS"
                  >
                    <span class="material-symbols-outlined">content_copy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <div id="image-builder-screen" class="hidden">
      <main class="main-content">
        <header class="main-header">
           <button id="image-builder-back-btn" class="icon-button" aria-label="Back to home">
            <span class="material-symbols-outlined">arrow_back</span>
          </button>
          <h1>Image Builder</h1>
          <div class="header-right">
             <button class="theme-toggle-btn icon-button" aria-label="테마 전환">
              <span class="material-symbols-outlined">light_mode</span>
            </button>
          </div>
        </header>
        <div class="builder-layout">
            <div class="config-panel">
                <div class="inspector-section">
                    <h3>Prompt</h3>
                    <textarea id="image-prompt-input" rows="8"></textarea>
                </div>
                <div class="inspector-section">
                    <h3 style="margin-bottom: 8px">Negative Prompt</h3>
                    <textarea id="image-negative-prompt-input" rows="5"></textarea>
                </div>
                <div class="button-group">
                    <button id="generate-image-btn" class="primary-btn">Generate</button>
                </div>
            </div>
            <div class="preview-panel">
                <div class="preview-box">
                    <img id="generated-image-main" alt="Generated Image Preview" style="display: none;" />
                    <div class="loader" id="image-loader"></div>
                    <p id="image-error-message"></p>
                </div>
            </div>
        </div>
      </main>
    </div>
`;

const ContentsBuilder = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      // Give time for DOM to render
      setTimeout(() => {
        initContentsBuilder();
      }, 100);
    } catch (e) {
      console.error("ContentsBuilder init failed:", e);
    }
  }, []);

  return (
    <div
      className="contents-builder-wrapper"
      style={{ width: '100%', height: '100%', position: 'relative' }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default ContentsBuilder;
