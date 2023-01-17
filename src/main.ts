import { Editor, MarkdownPostProcessorContext, Plugin } from 'obsidian';
import { parseConfig } from './utils/config';
import { ALL_MATCHERS, DEFAULT_SETTINGS, TABLE_CLASS_NAME } from './constants';
import { CodeBlockRenderer } from './renderers/code-block-renderer';
import { DynamicTOCSettingsTab } from './settings-tab';
import {
  DynamicTOCSettings,
  ExternalMarkdownKey,
  EXTERNAL_MARKDOWN_PREVIEW_STYLE,
  TableOptions
} from './types';
import { DynamicInjectionRenderer } from './renderers/dynamic-injection-renderer';
import { InsertCommandModal } from './insert-command.modal';
import cssPath from './utils/cssPath';

export default class DynamicTOCPlugin extends Plugin {
  settings: DynamicTOCSettings;
  options: TableOptions;

  onload = async () => {
    await this.loadSettings();
    this.addSettingTab(new DynamicTOCSettingsTab(this.app, this));
    this.addCommand({
      id: 'dynamic-toc-insert-command',
      name: 'Insert Table of Contents',
      editorCallback: (editor: Editor) => {
        const modal = new InsertCommandModal(this.app, this);
        modal.start((text: string) => {
          editor.setCursor(editor.getCursor().line, 0);
          editor.replaceSelection(text);
        });
      }
    });

    this.registerMarkdownCodeBlockProcessor(
      'toc',
      (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        this.options = parseConfig(source, this.settings);
        ctx.addChild(
          new CodeBlockRenderer(this.app, this.options, ctx.sourcePath, el)
        );
      }
    );

    this.registerMarkdownPostProcessor(
      (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        const matchers =
          this.settings.supportAllMatchers === true
            ? ALL_MATCHERS
            : [this.settings.externalStyle];

        for (const matcher of matchers as ExternalMarkdownKey[]) {
          if (!matcher || matcher === 'None') {
            continue;
          }

          const match = DynamicInjectionRenderer.findMatch(
            el,
            EXTERNAL_MARKDOWN_PREVIEW_STYLE[matcher as ExternalMarkdownKey]
          );

          if (!match?.parentNode) {
            continue;
          }

          ctx.addChild(
            new DynamicInjectionRenderer(
              this.app,
              this.settings,
              ctx.sourcePath,
              el,
              match
            )
          );
        }

        // If this is the table of contents...
        if (el.className && el.className.includes(TABLE_CLASS_NAME)) {
          const preserveNestedNumbering =
            this.options.preserve_nested_numbering ??
            this.settings.preserve_nested_numbering;

          if (preserveNestedNumbering) {
            const nestedLists = Array.from(el.querySelectorAll('li > ol'));
            let count = 1;

            for (const list of nestedLists) {
              const elPath = cssPath(list);
              const depth = elPath.match(/ol/g).length;
              if (depth > 2) {
                continue;
              }

              list.setAttribute('start', count.toString());
              count += list.children.length;
            }
          }
        }
      }
    );
  };

  loadSettings = async () => {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  };

  saveSettings = async () => {
    await this.saveData(this.settings);
    this.app.metadataCache.trigger('dynamic-toc:settings', this.settings);
  };
}
