/**
 * Fixture for VF-FIND-025: wrapper-encapsulated semantic drift.
 *
 * This page uses CardTitle without an `as` override AND has no raw <h1>
 * element. The validator MUST warn about that.
 *
 * Paired-condition: also includes a form-action <Button> that has NO `type=`
 * attribute, which would silently fail to submit. The validator MUST warn
 * about that too.
 *
 * NOTE: previous versions of this docstring avoided the literal `<h1>` and
 * `<Button>` tokens because the validator regex matched them in this comment.
 * That was a workaround; the root-cause fix is in `_strip_comments_and_strings`
 * which now removes comments/strings before regex matching. If you regress
 * that helper, this docstring's `<h1>` will cause the fixture to incorrectly
 * PASS the CardTitle check.
 */

import { Button } from "@/src/components/ui/button";
import { CardTitle } from "@/src/components/ui/card";

export default function FixturePage() {
  return (
    <main>
      <CardTitle>Sign in to your workspace</CardTitle>
      <form action={async () => "/* server action */"}>
        <Button>Submit me, except I won't submit</Button>
      </form>
    </main>
  );
}
