import assert from 'assert'
import { unified } from 'unified'
import { micromark } from 'micromark'
import remarkParse from 'remark-parse'
import remarkComment, { comment, commentHtml } from 'remark-comment'
import remarkRehype from 'remark-rehype'
import remarkStringify from 'remark-stringify'
import rehypeStringify from 'rehype-stringify'

function testRemark(markdown, options) {
  return unified()
    .use(remarkParse)
    .use(remarkComment, options)
    .use(remarkStringify)
    .processSync(markdown)
}

function testRehype(markdown, options) {
  return unified()
    .use(remarkParse)
    .use(remarkComment, options)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(markdown)
}

function testMicromark(markdown, options) {
  return micromark(markdown, {
    ...options,
    extensions: [comment],
    htmlExtensions: [commentHtml],
  })
}

// It prints what it parses, sans comments
assert.equal(
  testRemark(
    `# This <!-- inline -->document

<!-- has a comment -->

<!--
has a multi-line comment 
-->

<!-- another 
multi-line 
comment -->

and a paragraph
`
  ),
  '# This document\n\nand a paragraph\n'
)

// It prints what it parses including comments if ast: true
assert.equal(
  testRemark(
    `# This <!-- inline -->document

<!-- has a comment -->

<!--
has a multi-line comment 
-->

<!-- another 
multi-line 
comment -->

and a paragraph
`,
    { ast: true }
  ),
    `# This <!-- inline -->document

<!-- has a comment -->

<!--
has a multi-line comment 
-->

<!-- another 
multi-line 
comment -->

and a paragraph
`)

// It renders to HTML via Rehype
assert.equal(
  testRehype(
    `# This <!-- inline -->document

<!-- has a comment -->

<!--
has a multi-line comment 
-->

<!-- another 
multi-line 
comment -->

and a paragraph
`
  ),
  '<h1>This document</h1>\n<p>and a paragraph</p>'
)

// It renders to HTML via Rehype, even if ast is true, even though we cannot
// avoid rendering an extra line break.
assert.equal(
  testRehype(
    `# This <!-- inline -->document

<!-- has a comment -->

<!--
has a multi-line comment 
-->

<!-- another 
multi-line 
comment -->

and a paragraph
`,
    { ast: true }
  ),
  '<h1>This document</h1>\n\n\n\n<p>and a paragraph</p>'
)

// It renders to HTML via Micromark
assert.equal(
  testMicromark(
    `# This <!-- inline -->document

<!-- has a comment -->

<!--
has a multi-line comment 
-->

<!-- another 
multi-line 
comment -->

and a paragraph
`
  ),
  '<h1>This document</h1>\n<p>and a paragraph</p>\n'
)

// It renders within HTML elements
assert.equal(
  testMicromark(
    `# This <b><!-- inline --></b>document

<b><!-- has a comment --></b>

and a paragraph
`,
    { allowDangerousHtml: true }
  ),
  '<h1>This <b></b>document</h1>\n<p><b></b></p>\n<p>and a paragraph</p>\n'
)

// Handles malformed input
assert.equal(
  unified().use(remarkComment).use(remarkStringify).stringify({
    type: 'comment',
    commentValue: 'No arrows like this: --> are allowed in a comment',
  }),
  '<!--No arrows like this: --\\> are allowed in a comment-->\n'
)
