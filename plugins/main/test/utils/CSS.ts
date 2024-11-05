/*
  [attribute]	        [lang]	            Selects all elements with lang attribute
  [attribute=value]	  [lang="it"]	        Selects all elements with lang="it"
  [attribute~=value]	[title~="flower"]	  Selects all elements with a title attribute containing the word "flower"
  [attribute|=value]	[lang|="en"]	      Selects all elements with a lang attribute value equal to "en" or starting with "en-"
  [attribute^=value]	[href^="https"]	    Selects all elements with a href attribute value that begins with "https"
  [attribute$=value]	[href$=".pdf"]	    Selects all elements with a href attribute value ends with ".pdf"
  [attribute*=value]	[href*="w3schools"]	Selects all elements with a href attribute value containing the substring "w3schools"
 */
export namespace CSS {
  export enum Attribute {
    Equals = '',
    Includes = '~',
    Dashes = '|',
    Prefix = '^',
    Suffix = '$',
    Substring = '*',
  }

  export type Selector =
    | Attribute.Equals
    | Attribute.Includes
    | Attribute.Dashes
    | Attribute.Prefix
    | Attribute.Suffix
    | Attribute.Substring;
}
