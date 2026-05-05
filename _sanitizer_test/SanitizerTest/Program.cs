using Mjml.Net;

var renderer = new MjmlRenderer();
var options = new MjmlOptions { Beautify = true, KeepComments = false };

var mjml = @"<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text font-size=""16px"" color=""#4b5563"">
          <p>normal <span style=""color: rgba(255, 0, 0, 1)"">red text</span> more</p>
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>";

var result = await renderer.RenderAsync(mjml, options, default);
// Check if span with color is preserved
var html = result.Html;
if (html.Contains("color: rgba(255, 0, 0, 1)") || html.Contains("color:rgba") || html.Contains("#ff0000"))
    Console.WriteLine("✅ Color span PRESERVED in output");
else
    Console.WriteLine("❌ Color span STRIPPED from output");

// Show relevant part of HTML
var idx = html.IndexOf("red text");
if (idx >= 0)
    Console.WriteLine("Context: " + html.Substring(Math.Max(0, idx - 80), Math.Min(200, html.Length - Math.Max(0, idx-80))));
