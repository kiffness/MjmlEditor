using Ganss.Xss;

var sanitizer = new HtmlSanitizer();
sanitizer.AllowedTags.Clear();
sanitizer.AllowedTags.Add("strong");
sanitizer.AllowedTags.Add("em");
sanitizer.AllowedTags.Add("u");
sanitizer.AllowedTags.Add("a");
sanitizer.AllowedTags.Add("br");
sanitizer.AllowedTags.Add("p");
sanitizer.AllowedTags.Add("span");
sanitizer.AllowedAttributes.Clear();
sanitizer.AllowedAttributes.Add("href");
sanitizer.AllowedAttributes.Add("target");
sanitizer.AllowedAttributes.Add("style");
sanitizer.AllowedCssProperties.Clear();
sanitizer.AllowedCssProperties.Add("color");
sanitizer.AllowedCssProperties.Add("font-family");
sanitizer.AllowedCssProperties.Add("text-decoration");

var input = "<p><span style=\"color: #ff0000;\">red text</span></p>";
var output = sanitizer.Sanitize(input);
Console.WriteLine("Input:  " + input);
Console.WriteLine("Output: " + output);
