<template>
  <div class="mde-container" @keydown="onKeyDown">
    <div class="toolbar">
      <b-dropdown text="Menu" variant="primary">
        <b-dropdown-group header="Document">
          <b-dropdown-item @click="onOpenDocument(null)">
            Create New
          </b-dropdown-item>
          <b-dropdown-item @click="$refs.documentModal.show()">
            Open
          </b-dropdown-item>
        </b-dropdown-group>
        <b-dropdown-divider />
        <b-dropdown-group header="Export">
          <b-dropdown-item @click="onClickDownloadMarkdown()">
            Download Markdown
          </b-dropdown-item>
          <b-dropdown-item @click="onClickDownloadHtml()">
            Download HTML
          </b-dropdown-item>
          <b-dropdown-item @click="onClickBrowseHtml()">
            Browse HTML
          </b-dropdown-item>
        </b-dropdown-group>
        <b-dropdown-divider />
        <b-dropdown-group header="CSS">
          <b-dropdown-item @click="onOpenStylesheet(null)">
            Create New
          </b-dropdown-item>
          <b-dropdown-item @click="$refs.stylesheetModal.show()">
            Open
          </b-dropdown-item>
        </b-dropdown-group>
      </b-dropdown>
      <b-input type="text" v-model="title" class="title-input" />
      <b-button @click="onClickSave" variant="primary">save</b-button>
      <div class="message">{{ message }}</div>
    </div>
    <div class="writer-wrapper">
      <textarea
        v-model="text"
        ref="textInput"
        class="writer"
        @scroll="onScroll"
        @paste="onPaste"
      />
    </div>
    <iframe v-show="mode === 'md'" ref="previewIframe" class="viewer" />
    <b-modal
      ref="documentModal"
      title="Documents"
      @ok="onOpenDocument(selectedDocument.name)"
    >
      <b-table
        :fields="[
          'name',
          { key: 'datetime', formatter: (v) => v.toLocaleString() },
        ]"
        :items="documents"
        selectable
        select-mode="single"
        head-variant="light"
        @row-selected="(rows) => (selectedDocument = rows[0])"
        sticky-header
        no-border-collapse
      />
    </b-modal>
    <b-modal
      ref="stylesheetModal"
      title="Stylesheets"
      @ok="onOpenStylesheet(selectedStylesheet.name)"
    >
      <b-table
        :fields="[
          'name',
          { key: 'datetime', formatter: (v) => v.toLocaleString() },
        ]"
        :items="stylesheets"
        selectable
        select-mode="single"
        head-variant="light"
        @row-selected="(rows) => (selectedStylesheet = rows[0])"
        sticky-header
        no-border-collapse
      />
    </b-modal>
  </div>
</template>

<script>
import marked from "marked";
import hljs from "highlight.js";
import Dexie from "dexie";

export default {
  data() {
    return {
      mode: "md",
      title: "",
      text: "",
      message: "",
      stylesheets: [],
      documents: [],
      selectedDocument: null,
      selectedStylesheet: null,
    };
  },
  async created() {
    this.storage = new Dexie("mdedb");
    this.storage.version(2).stores({
      documents: "name",
      stylesheets: "name",
      documentContents: "name",
      stylesheetContents: "name",
    });
    this.documents = await this.storage.documents.toArray();
    this.stylesheets = await this.storage.stylesheets.toArray();
    marked.setOptions({
      langPrefix: "hljs language-",
      highlight: (code, lang) => {
        return hljs.highlightAuto(code, [lang]).value;
      },
    });
  },
  mounted() {
    this.initPreview();
  },
  methods: {
    async initPreview() {
      const stylesheets = await this.storage.stylesheetContents.toArray();
      const iframeDocument = this.$refs.previewIframe.contentWindow.document;
      const meta = document.createElement("meta");
      meta.setAttribute("charset", "utf-8");
      iframeDocument.head.appendChild(meta);
      for (let stylesheet of stylesheets) {
        const style = document.createElement("style");
        style.textContent = stylesheet.text;
        iframeDocument.head.appendChild(style);
      }
      this.previewElement = document.createElement("article");
      this.previewElement.classList.add("content");
      iframeDocument.body.appendChild(this.previewElement);
    },
    async onOpenDocument(fileName) {
      this.mode = "md";
      if (fileName) {
        const document = await this.storage.documentContents.get({
          name: fileName,
        });
        this.title = document.name;
        this.text = document.text;
      } else {
        this.title = "new";
        this.text = "";
      }
      this.initPreview();
    },
    async onOpenStylesheet(fileName) {
      this.mode = "css";
      if (fileName) {
        const stylesheet = await this.storage.stylesheetContents.get({
          name: fileName,
        });
        this.title = stylesheet.name;
        this.text = stylesheet.text;
      } else {
        this.title = "new.css";
        this.text = "";
      }
    },
    async onClickSave() {
      if (this.mode === "md") {
        await this.storage.documents.put({
          name: this.title,
          datetime: new Date(),
        });
        await this.storage.documentContents.put({
          name: this.title,
          text: this.text,
        });
        this.documents = await this.storage.documents.toArray();
      } else {
        await this.storage.stylesheets.put({
          name: this.title,
          datetime: new Date(),
        });
        await this.storage.stylesheetContents.put({
          name: this.title,
          text: this.text,
        });
        this.stylesheets = await this.storage.stylesheets.toArray();
      }
      this.message = `Saved ${this.title} at ${new Date().toLocaleString()}`;
    },
    onClickDownloadMarkdown() {
      this.download(this.title + ".md", this.text);
    },
    onClickDownloadHtml() {
      this.download(
        this.title + ".html",
        this.$refs.previewIframe.contentDocument.documentElement.outerHTML
      );
    },
    onClickBrowseHtml() {
      this.browse(
        this.title + ".html",
        this.$refs.previewIframe.contentDocument.documentElement.outerHTML
      );
    },
    download(fileName, content) {
      const blob = new Blob([content], { type: "text/plain" });
      const anchor = document.createElement("a");
      anchor.href = URL.createObjectURL(blob);
      anchor.setAttribute("download", fileName);
      anchor.dispatchEvent(new MouseEvent("click"));
    },
    browse(fileName, content) {
      const blob = new Blob([content], { type: "text/html" });
      const anchor = document.createElement("a");
      anchor.href = URL.createObjectURL(blob);
      anchor.setAttribute("target", "blank");
      anchor.dispatchEvent(new MouseEvent("click"));
    },
    insertText(text) {
      const len = this.text.length;
      const pos = this.$refs.textInput.selectionStart;
      const before = this.text.substr(0, pos);
      const after = this.text.substr(pos, len);
      this.text = before + text + after;
    },
    onPaste() {
      const clipBoardData = event.clipboardData.items[0];
      if (clipBoardData.type !== "image/png") return;
      event.preventDefault();
      const file = clipBoardData.getAsFile();
      const reader = new FileReader();
      reader.onload = (e) => {
        var base64 = e.target.result;
        this.insertText(`![](${base64})`);
      };
      reader.readAsDataURL(file);
    },
    onScroll() {
      const scrollTrigger = event.target;
      const scrollTarget = this.previewElement.parentElement;
      const scrollRatio =
        scrollTrigger.scrollTop /
        (scrollTrigger.scrollHeight - scrollTrigger.clientHeight);
      scrollTarget.scrollTo(
        0,
        scrollRatio * (scrollTarget.scrollHeight - scrollTarget.clientHeight)
      );
    },
    onKeyDown() {
      if (event.ctrlKey) {
        if (event.key === "s") {
          event.preventDefault();
          this.onClickSave();
        }
      }
    },
  },
  watch: {
    async text() {
      if (this.mode !== "md") return;
      if (
        this.$refs.previewIframe.contentWindow.document.body.children[0] !==
        this.previewElement
      ) {
        this.$refs.previewIframe.contentWindow.document.body.innerHTML = "";
        await this.initPreview();
      }
      this.previewElement.innerHTML = marked(this.text);
    },
  },
};
</script>
<style scoped>
.mde-container {
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 50px 1fr;
  background-color: white;
}
.toolbar {
  grid-column-start: 1;
  grid-column-end: 3;
  grid-row-start: 1;
  display: flex;
  padding: 5px;
  background-color: gray;
}
.toolbar > * {
  margin-left: 5px;
}

.tool-icon {
  width: 40px;
  height: 40px;
  border-radius: 5px;
  text-align: center;
  font-size: 20px;
  line-height: 40px;
  color: white;
  cursor: pointer;
}
.tool-icon:hover {
  background-color: lightgray;
}
.title-input {
  width: 300px;
}
.message {
  margin-left: auto;
  color: white;
  line-height: 40px;
}
.writer-wrapper {
  grid-column-start: 1;
  grid-row-start: 2;
  border: none;
  border-right: 1px solid lightgray;
}
.writer {
  width: 100%;
  height: 100%;
  padding: 20px;
  overflow-x: hidden;
  overflow-y: auto;
  resize: none;
  border: none;
  font-size: 14px;
  white-space: nowrap;
}
.writer:focus {
  outline: none;
}
.viewer {
  grid-column-start: 2;
  grid-row-start: 2;
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;
  height: 100%;
  border: none;
}
</style>
