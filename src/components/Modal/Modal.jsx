import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import PropTypes from 'prop-types';
import clsx from 'clsx';

export default function Modal({ open, onClose, children, className }) {
  return (
    <Transition appear as={Fragment} show={open}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={onClose}
        data-testid="modal"
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="translate-y-4 opacity-0"
            enterTo="translate-y-0 opacity-100"
            leave="ease-in duration-100"
            leaveFrom="translate-y-0 opacity-100"
            leaveTo="translate-y-4 opacity-0"
          >
            <Dialog.Panel
              className={clsx(
                'w-full max-w-md rounded-lg bg-white p-6 shadow-xl',
                className,
              )}
            >
              {children}
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}

Modal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  children: PropTypes.node,
  className: PropTypes.string,
};