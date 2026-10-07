import { useState } from "react";
import { Link } from "../router";
import { BLOOD_GROUPS, CAN_GIVE_TO, CAN_RECEIVE_FROM, fmtGroup, groupFamily } from "../data";
import { GroupChip } from "./ui";

/* The home page's interactive moment: a blood bag tag that answers "who can I help, who can help me?" */
export default function BloodTag() {
  const [group, setGroup] = useState("O+");
  const encoded = encodeURIComponent(group);

  return (
    <div className="tag-wrap">
      <div className="tag-swing">
        <section className="tag" aria-label="Blood group compatibility">
                    <div className={`tag-head g-${groupFamily(group)}`}>
            <div>
              <p className="tag-kicker">Your blood group</p>
              <p className="tag-glyph" aria-live="polite">
                {fmtGroup(group)}
              </p>
            </div>
            <p className="tag-hint">Tap yours to see who you can help.</p>
          </div>

          <div className="tag-grid" role="radiogroup" aria-label="Choose your blood group">
            {BLOOD_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                role="radio"
                aria-checked={group === g}
                className={`tag-opt${group === g ? " on" : ""}`}
                onClick={() => setGroup(g)}
              >
                {fmtGroup(g)}
              </button>
            ))}
          </div>

          <div className="tag-rows">
            <div>
              <h2>You can give to</h2>
              <div className="chips">
                {CAN_GIVE_TO[group].map((g) => (
                  <GroupChip key={g} group={g} />
                ))}
              </div>
            </div>
            <div>
              <h2>You can receive from</h2>
              <div className="chips">
                {CAN_RECEIVE_FROM[group].map((g) => (
                  <GroupChip key={g} group={g} />
                ))}
              </div>
            </div>
          </div>

          <div className="tag-actions">
            <Link to={`/register?group=${encoded}`}>Register as {fmtGroup(group)} donor</Link>
            <Link to={`/request-blood?group=${encoded}`}>Request {fmtGroup(group)} blood</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
