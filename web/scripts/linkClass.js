class Linker {
    constructor() {
        this.linkPreview = [];
        this.Base = window.location.origin;
        this.Page = window.location.pathname;
        // this.link = [];
        var lnk = window.location.search;
        lnk = lnk.slice(1).split("&");
        if (lnk.length === 0 && lnk[0] === "") {
            this.link = [];
        } else {
            this.link = lnk.map(e => {
                var a = e.split("=");
                a[1] = decodeURIComponent(a[1]);
                if (a[1].trim().toLowerCase() === "true") a[1] = true;
                else if (a[1].trim().toLowerCase() === "false") a[1] = false;
                else if (/^\d+$/.test(a[1].trim().toLowerCase())) a[1] = parseFloat(a[1].trim());
                else if (a[1].trim().toLowerCase() === "null") a[1] = null;
                else if (a[1].trim().toLowerCase() === "undefined") a[1] = undefined;
                else if (a[1].trim().toLowerCase() === "nan") a[1] = NaN;
                else if (a[1].trim().toLowerCase() === "infinity") a[1] = Infinity;
                else if (a[1].trim().toLowerCase() === "-infinity") a[1] = -Infinity;
                else if ((a[1].trim().toLowerCase().startsWith("[") && a[1].trim().toLowerCase().endsWith("]")) || (a[1].trim().toLowerCase().startsWith("{") && a[1].trim().toLowerCase().endsWith("}"))) {
                    try {
                        a[1] = JSON.parse(a[1].trim())
                    } catch (err) {}
                }
                return {
                    Varname: a[0],
                    Var: a[1]
                }
            });
            this.link = this.link.sort((a, b) => a.Varname.localeCompare(b.Varname));
            this.link = this.link.filter(e => e.Var !== undefined);
            this.UpdateMyLink();
        }
        this.UpdatePreview();
    }

    UpdateMyLink() {
        window.history.pushState({}, "", this.Link);
    }

    get Link() {
        return `${this.base}/${this.page}${this.link.length !== 0 ? '?' : ''}${this.link.map(e => {
            var Var = e.Var;
            if (typeof Var === "string") Var = encodeURIComponent(Var);
            else if (typeof Var === "object") Var = encodeURIComponent(JSON.stringify(Var));
            else if (typeof Var === "number") Var = encodeURIComponent(Var);
            else if (typeof Var === "boolean") Var = encodeURIComponent(Var);
            else if (typeof Var === "undefined") Var = "undefined";
            else if (typeof Var === "null") Var = "null";
            else if (typeof Var === "NaN") Var = "NaN";
            else if (typeof Var === "Infinity") Var = "Infinity";
            else if (typeof Var === "-Infinity") Var = "-Infinity";
            return `${e.Varname}=${Var}`
        }).join('&')}`
    }

    set Base(url) {
        url.replaceAll("//", "/").replaceAll(" ", "");
        if (url.startsWith("/")) url = url.slice(1);
        if (url.endsWith("/")) url = url.slice(0, -1);
        this.base = url;
        this.UpdatePreview();
    }

    set Page(url) {
        url.replaceAll("//", "/").replaceAll(" ", "");
        if (url.startsWith("/")) url = url.slice(1);
        if (url.endsWith("/")) url = url.slice(0, -1);
        this.page = url;
        this.UpdatePreview();
    }

    Set(name, content) {
        if (typeof name !== "string") name = `${name}`;
        name = name.toLowerCase().replaceAll(" ", "_").replaceAll("-", "_");
        if (this.link.find(e => e.Varname === name)) {
            this.link.find(e => e.Varname === name).Var = content;
        } else {
            this.link.push({
                Varname: name,
                Var: content
            });
            this.link = this.link.sort((a, b) => a.Varname.localeCompare(b.Varname));
            this.link = this.link.filter(e => e.Var !== undefined);
        }
        this.UpdatePreview();
    }

    Get(name) {
        if (typeof name !== "string") name = `${name}`;
        name = name.toLowerCase().replaceAll(" ", "_").replaceAll("-", "_");
        try {
            return this.link.find(e => e.Varname === name).Var;
        } catch (err) {
            return undefined;
        }
    }

    MakePreview(item) {
        const items = document.querySelectorAll(item);
        items.forEach(e => {
            this.linkPreview.push(e);
        });
        this.UpdatePreview();
    }

    UpdatePreview() {
        console.log(this.linkPreview);
        this.linkPreview?.forEach(e => {
            e.innerText = this.Link;
        });
    }
}

const linker = new Linker();