"use client";

import { useCallback } from "react";
import './style.css';
import type {
  Pharmacy,
  RegistrationRequest,
} from "./types";

interface Props {
  requests: RegistrationRequest[];
  setRequests: React.Dispatch<React.SetStateAction<RegistrationRequest[]>>;
  setPharmacies: React.Dispatch<React.SetStateAction<Pharmacy[]>>;
  showToast: (message: string) => void;
  onApprove?: (request: RegistrationRequest) => Promise<void> | void;
  onReject?: (request: RegistrationRequest) => Promise<void> | void;
}

export default function RegistrationRequests({
  requests = [],
  setRequests,
  setPharmacies,
  showToast,
  onApprove,
  onReject,
}: Props) {

  // ✅ استخدام useCallback لتأكيد نقاء الدالة واعتبارها Event Handler صريح
  const approveRequest = useCallback(async (request: RegistrationRequest) => {
    if (onApprove) {
      await onApprove(request);
      return;
    }

    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const newPharmacy: Pharmacy = {
      id: Number(Date.now()), // أو استخدام id رقمي فريد
      name: request.name || "صيدلية جديدة",
      city: request.city || "غير محدد",
      joined: formattedDate,
      rating: 0,
      status: "نشطة",
      initials: (request.name || "ص").slice(0, 2),
      color: "linear-gradient(135deg,#0F6E5C,#159A80)",
    };

    setPharmacies((prev) => [...prev, newPharmacy]);
    setRequests((prev) => prev.filter((r) => r.id !== request.id));

    showToast(`✓ تمت الموافقة على "${request.name}" وانضمت للمنصة`);
  }, [onApprove, setPharmacies, setRequests, showToast]);

  const rejectRequest = useCallback(async (request: RegistrationRequest) => {
    if (onReject) {
      await onReject(request);
      return;
    }

    setRequests((prev) => prev.filter((r) => r.id !== request.id));
    showToast(`تم رفض طلب "${request.name}"`);
  }, [onReject, setRequests, showToast]);

  return (
    <section>
      <div className="section-intro">
        <p>
          راجع طلبات انضمام الصيدليات الجديدة، وتحقق من بياناتها قبل الموافقة عليها لتظهر في المنصة.
        </p>
      </div>

      <div className="request-grid">
        {(requests || []).map((request) => (
          <article className="request-card" key={request.id}>
            <div className="request-card__top">
              <span className="request-card__logo">
                {request.name ? request.name.charAt(0) : "ص"}
              </span>

              <div>
                <div className="request-card__name">
                  {request.name}
                </div>

                <div className="request-card__owner">
                  صاحب الطلب: {request.owner || "غير معروف"}
                </div>
              </div>
            </div>

            <ul className="request-card__facts">
              <li>
                <span>المدينة</span>
                <strong>{request.city || "—"}</strong>
              </li>

              <li>
                <span>رقم الترخيص</span>
                <strong>{request.license || "—"}</strong>
              </li>

              <li>
                <span>تاريخ الطلب</span>
                <strong>{request.date || "—"}</strong>
              </li>
            </ul>

            <div className="request-card__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => approveRequest(request)}
              >
                قبول
              </button>

              <button
                type="button"
                className="btn btn--reject"
                onClick={() => rejectRequest(request)}
              >
                رفض
              </button>
            </div>
          </article>
        ))}
      </div>

      {(!requests || requests.length === 0) && (
        <p className="empty-state">
          لا توجد طلبات تسجيل جديدة حاليًا 🎉
        </p>
      )}
    </section>
  );
}


// "use client";
// import './style.css'
// import type {
//   Pharmacy,
//   RegistrationRequest,
// } from "./types";

// interface Props {
//   requests: RegistrationRequest[];
//   setRequests: React.Dispatch<React.SetStateAction<RegistrationRequest[]>>;
//   setPharmacies: React.Dispatch<React.SetStateAction<Pharmacy[]>>;
//   showToast: (message: string) => void;
//   // onApprove: (request: RegistrationRequest) => void
//   // onReject: (id: number) => void
// }

// export default function RegistrationRequests({
//   requests,
//   setRequests,
//   setPharmacies,
//   showToast,
// }: Props) {
//   const approveRequest = (
//     request: RegistrationRequest
//   ) => {
//     const newPharmacy: Pharmacy = {
//       id: Date.now(),
//       name: request.name,
//       city: request.city,
//       joined: new Date()
//         .toISOString()
//         .slice(0, 10),
//       rating: 0,
//       status: "نشطة",
//       initials: request.name.slice(0, 2),
//       color:
//         "linear-gradient(135deg,#0F6E5C,#159A80)",
//     };

//     setPharmacies((prev) => [
//       ...prev,
//       newPharmacy,
//     ]);

//     setRequests((prev) =>
//       prev.filter(
//         (r) => r.id !== request.id
//       )
//     );

//     showToast(
//       `✓ تمت الموافقة على "${request.name}" وانضمت للمنصة`
//     );
//   };

//   const rejectRequest = (
//     request: RegistrationRequest
//   ) => {
//     setRequests((prev) =>
//       prev.filter(
//         (r) => r.id !== request.id
//       )
//     );

//     showToast(
//       `تم رفض طلب "${request.name}"`
//     );
//   };

//   return (
//     <section>

//       <div className="section-intro">
//         <p>
//           راجع طلبات انضمام الصيدليات الجديدة،
//           وتحقق من بياناتها قبل الموافقة عليها
//           لتظهر في المنصة.
//         </p>
//       </div>

//       <div className="request-grid">

//         {requests.map((request) => (
//           <article
//             className="request-card"
//             key={request.id}
//           >

//             <div className="request-card__top">

//               <span className="request-card__logo">
//                 {request.name.charAt(0)}
//               </span>

//               <div>
//                 <div className="request-card__name">
//                   {request.name}
//                 </div>

//                 <div className="request-card__owner">
//                   صاحب الطلب:{" "}
//                   {request.owner}
//                 </div>
//               </div>

//             </div>

//             <ul className="request-card__facts">

//               <li>
//                 <span>المدينة</span>
//                 <strong>
//                   {request.city}
//                 </strong>
//               </li>

//               <li>
//                 <span>رقم الترخيص</span>
//                 <strong>
//                   {request.license}
//                 </strong>
//               </li>

//               <li>
//                 <span>تاريخ الطلب</span>
//                 <strong>
//                   {request.date}
//                 </strong>
//               </li>

//             </ul>

//             <div className="request-card__actions">

//               <button
//                 type="button"
//                 className="btn btn--ghost"
//                 onClick={() =>
//                   approveRequest(request)
//                 }
//               >
//                 قبول
//               </button>

//               <button
//                 type="button"
//                 className="btn btn--reject"
//                 onClick={() =>
//                   rejectRequest(request)
//                 }
//               >
//                 رفض
//               </button>

//             </div>

//           </article>
//         ))}

//       </div>

//       {requests.length === 0 && (
//         <p className="empty-state">
//           لا توجد طلبات تسجيل جديدة حاليًا 🎉
//         </p>
//       )}

//     </section>
//   );
// }