// src/features/patents/components/Layout/ClaimsContent.jsx
import PropTypes from 'prop-types';
import clsx from 'clsx';

export default function ClaimsContent({ patent }) {
    const claimsList = Array.isArray(patent?.claims) ? patent.claims : [];

    return (
        // Container for claims list, padding/scrolling handled by parent Tab.Panel
        <>
            {claimsList.length > 0 ? (
                <div className="space-y-4">
                    {claimsList
                        .filter(claim => claim && typeof claim.text === 'string')
                        .map((claim, index) => (
                            <div
                                key={claim.id || `claim-${index}`}
                                className={clsx(
                                    "flex text-sm",
                                    claim.type === 'claim-dependent' && 'ml-6'
                                )}
                            >
                                <span className="font-semibold mr-2 w-6 flex-shrink-0 text-right">
                                    {index + 1}.
                                </span>
                                <span className="flex-grow">{claim.text}</span>
                            </div>
                        ))}
                </div>
            ) : (
                <p className="text-sm text-gray-500">No claims found for this patent.</p>
            )}
        </>
    );
}

ClaimsContent.propTypes = {
    patent: PropTypes.shape({
        claims: PropTypes.arrayOf(PropTypes.shape({
            id: PropTypes.string,
            type: PropTypes.string,
            text: PropTypes.string.isRequired,
        })),
    }),
};

ClaimsContent.defaultProps = {
    patent: {
        claims: [],
    },
};