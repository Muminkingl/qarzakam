import { Element } from "react-scroll";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../constants/LanguageContext";
import Button from "../components/Button.jsx";

const Pricing = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleFreePlanClick = () => {
    navigate('/dashboard');
  };

  return (
    <section className="py-32 max-lg:py-24 max-md:py-16">
      <Element name="pricing">
        <div className="container">
          <h2 className="h2 text-center text-p4 mb-16">
            {t("pricing_section.title")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="relative rounded-[2.5rem] p-8 border-2 border-s4/25 bg-s2/50">
              <div className="text-center mb-8">
                <h3 className="h4 text-p4 mb-4">{t("pricing_section.free")}</h3>
                <div className="flex justify-center items-baseline gap-1">
                  <span className="h3 text-p4">$0</span>
                  <span className="text-p3">/{t("pricing_section.unit")}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-p4">
                  <img src="/images/check.svg" alt="check" className="w-6 h-6" />
                  {t("pricing_section.features.free.1")}
                </li>
                <li className="flex items-center gap-3 text-p4">
                  <img src="/images/check.svg" alt="check" className="w-6 h-6" />
                  {t("pricing_section.features.free.2")}
                </li>
                <li className="flex items-center gap-3 text-p4">
                  <img src="/images/check.svg" alt="check" className="w-6 h-6" />
                  {t("pricing_section.features.free.3")}
                </li>
              </ul>

              <Button
                containerClassName="w-full"
                className="w-full justify-center"
                variant="outline"
                onClick={handleFreePlanClick}
              >
                {t("pricing_section.get_started")}
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="relative rounded-[2.5rem] p-8 border-2 border-p1 bg-s2 before:absolute before:inset-0.5 before:rounded-[2.5rem] before:bg-gradient-to-b before:from-p1/25 before:to-transparent before:pointer-events-none">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-p1 to-p2 text-s1 text-sm font-semibold">
                {t("pricing_section.recommended")}
              </div>

              <div className="text-center mb-8">
                <h3 className="h4 text-p4 mb-4">{t("pricing_section.pro")}</h3>
                <div className="flex justify-center items-baseline gap-1">
                  <span className="h3 text-p4">$15</span>
                  <span className="text-p3">/{t("pricing_section.unit")}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-p4">
                  <img src="/images/check.svg" alt="check" className="w-6 h-6" />
                  {t("pricing_section.features.pro.1")}
                </li>
                <li className="flex items-center gap-3 text-p4">
                  <img src="/images/check.svg" alt="check" className="w-6 h-6" />
                  {t("pricing_section.features.pro.2")}
                </li>
                <li className="flex items-center gap-3 text-p4">
                  <img src="/images/check.svg" alt="check" className="w-6 h-6" />
                  {t("pricing_section.features.pro.3")}
                </li>
                <li className="flex items-center gap-3 text-p4">
                  <img src="/images/check.svg" alt="check" className="w-6 h-6" />
                  {t("pricing_section.features.pro.4")}
                </li>
              </ul>

              <Button
                containerClassName="w-full"
                className="w-full justify-center cursor-not-allowed opacity-75"
                disabled
              >
                {t("pricing_section.coming_soon")}
              </Button>
            </div>
          </div>
        </div>
      </Element>
    </section>
  );
};

export default Pricing;
