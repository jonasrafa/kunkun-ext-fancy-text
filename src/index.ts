import {
  clipboard,
  expose,
  List,
  toast,
  ui,
  WorkerExtension,
} from "@kksh/api/ui/worker";
import fonts from "./fonts.json";
import { PseudoFont } from "./pseudo-font";

const Actions = {
  copyToClipboard: "Copy to Clipboard",
};

class ExtensionTemplate extends WorkerExtension {
  private term: string = "Lorem Ipsum";
  private fontsFiltered: PseudoFont[] = [];

  async load() {
    const pseudoFonts = fonts.map((font) => {
      const pseudoFont = new PseudoFont(
        font.fontName,
        font.fontLower || "abcdefghijklmnopqrstuvwxyz",
        font.fontUpper || "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        font.fontDigits || "0123456789"
      );
      if (font.experimentalFont) {
        pseudoFont.experimental = true;
      }
      return pseudoFont;
    });

    this.fontsFiltered = pseudoFonts
      .filter((font) => !font.experimental)
      .sort((a, b) => a.fontName.localeCompare(b.fontName));

    return ui.setSearchBarPlaceholder("Type your text here...").then(() => {
      return ui.render(
        new List.List({
          filter: "none",
          items: this.renderList(this.term),
        })
      );
    });
  }

  renderList(searchTerm: string = ""): List.Item[] {
    if (searchTerm) {
      this.term = searchTerm;
    }
    return this.fontsFiltered.map((font) => {
      return new List.Item({
        title: font.convert(this.term),
        value: font.fontName,
        accessories: [
          new List.ItemAccessory({
            text: font.fontName,
          }),
        ],
      });
    });
  }

  async onSearchTermChange(term: string): Promise<void> {
    return ui.render(
      new List.List({
        defaultAction: Actions.copyToClipboard,
        filter: "none",
        items: this.renderList(term),
      })
    );
  }

  onListItemSelected(value: string): Promise<void> {
    const font = this.fontsFiltered.find((font) => font.fontName === value);
    if (font) {
      console.log(value);
      clipboard.writeText(font.convert(this.term));
      toast.success("Copied to clipboard");
    }
    return Promise.resolve();
  }
}

expose(new ExtensionTemplate());
